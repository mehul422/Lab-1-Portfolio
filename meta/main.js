import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

let data = [];
let commits = [];
let selectedCommits = [];
let xScale, yScale;
let commitProgress = 100;
let timeScale, commitMaxTime; // Declare timeScale and commitMaxTime here

// Load data and initialize the chart
async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    processCommits();
    displayStats();
    updateTimeSlider(); // Call after data is loaded
}

function displayStats() {
    processCommits(); // Ensure commits are processed before stats
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
    dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
    dl.append('dd').text(data.length);

    dl.append('dt').text('Total Commits');
    dl.append('dd').text(commits.length);

    let uniqueFiles = new Set(data.map(d => d.file)).size;
    dl.append('dt').text("Codebase File Count");
    dl.append('dd').text(uniqueFiles);

    let fileDepths = new Map();
    data.forEach(d => {
        fileDepths.set(d.file, d.depth);
    });

    let totalDepth = Array.from(fileDepths.values()).reduce((sum, depth) => sum + depth, 0);
    let avgDepth = fileDepths.size > 0 ? (totalDepth / fileDepths.size).toFixed(2) : 0;
    dl.append('dt').text("Average File Depth");
    dl.append('dd').text(avgDepth);
}

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };

        Object.defineProperty(ret, 'lines', {
          value: lines,
          enumerable: false,
          writable: false,
          configurable: false,
        });

        return ret;
      });

    // Initialize time scale and max time after commits are processed
    timeScale = d3.scaleTime()
      .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
      .range([0, 100]);

    commitMaxTime = timeScale.invert(commitProgress);
}

function updateTimeSlider() {
    const slider = d3.select('#commit-progress');
    const timeDisplay = d3.select('#commit-time');
    const selectedTimeDisplay = d3.select('#selectedTime');

    slider.on('input', function(event) {
        commitProgress = event.target.value;
        commitMaxTime = timeScale.invert(commitProgress);

        // Update commit time display
        const timeStr = commitMaxTime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
        timeDisplay.text(timeStr);
        selectedTimeDisplay.text(timeStr);

        updateScatterplot(); // Update the scatterplot with filtered data
    });
}

function createScatterplot(filteredCommits = commits) {
    const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);
    const width = 1000;
    const height = 600;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([height, 0]);

    const dots = svg.append('g').attr('class', 'dots');

    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([2, 30]);

    dots
        .selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .style('fill-opacity', 0.7)
        .attr('fill', 'steelblue')
        .on('mouseenter', function (event, d) {
            d3.select(event.currentTarget).classed('selected', isCommitSelected(d));
            d3.select(event.currentTarget).style('fill-opacity', 1);
            updateTooltipContent(d);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', function (event, d) {
            d3.select(event.currentTarget).classed('selected', isCommitSelected(d));
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipContent({});
            updateTooltipVisibility(false);
        });

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg.append('g').attr('transform', `translate(0, ${usableArea.bottom})`).call(xAxis);

    // Add Y axis
    svg.append('g').attr('transform', `translate(${usableArea.left}, 0)`).call(yAxis);

    // Add gridlines BEFORE the axes
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
}

function updateScatterplot() {
    const filteredCommits = commits.filter(
        (commit) => commit.datetime <= commitMaxTime
    );

    // Recreate scatterplot with filtered data
    d3.select('#chart').selectAll('*').remove(); // Remove previous chart
    createScatterplot(filteredCommits);
}

function updateTooltipContent(commit) {
    if (Object.keys(commit).length === 0) return;

    document.getElementById('commit-link').href = commit.url;
    document.getElementById('commit-link').textContent = commit.id;
    document.getElementById('commit-date').textContent = commit.datetime?.toLocaleDateString('en', {
        dateStyle: 'full',
    });
    document.getElementById('commit-time').textContent = commit.datetime?.toLocaleTimeString('en', {
        timeStyle: 'short',
    });
    document.getElementById('commit-author').textContent = commit.author;
    document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    createScatterplot();  // Call after data is loaded
});

