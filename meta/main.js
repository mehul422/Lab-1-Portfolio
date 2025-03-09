import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
let data = [];
let commits = [];
let selectedCommits = [];
let filteredCommits = []; // Add this new array for filtered commits
let xScale, yScale;
let commitProgress = 100;
let timeScale; 
let commitMaxTime; 

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), 
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    
    // Process commits first so they're available for displayStats
    processCommits();
    
    // Display statistics using the processed commits
    displayStats();
    
    // Initialize the slider after commits are processed
    initializeSlider();
    
    // Create initial scatterplot
    updateScatterplot();
    
    // Create initial file visualization
    updateFileVisualization();
    
    // Initialize brush selector after scatterplot is created
    brushSelector();
}

function initializeSlider() {
    // Create a time scale that maps the commit dates to 0-100 range
    timeScale = d3.scaleTime()
        .domain([d3.min(commits, d => d.datetime), d3.max(commits, d => d.datetime)])
        .range([0, 100]);
  
    // Set initial max time based on slider position (100 = all commits)
    updateCommitMaxTime();
    
    // Initialize filtered commits
    filterCommitsByTime();
    
    // Update the date displays
    updateDateDisplay();
  
    // Add event listener to the slider
    const slider = document.getElementById('commit-progress');
    slider.addEventListener('input', function() {
        // Update the commitProgress variable
        commitProgress = parseFloat(this.value);
        
        // Update max time based on new slider position
        updateCommitMaxTime();
        
        // Filter commits by time
        filterCommitsByTime();
        
        // Update the date displays
        updateDateDisplay();
        
        // Update the scatterplot with filtered commits
        updateScatterplot();
    });
}

// Update the commitMaxTime based on the slider position
function updateCommitMaxTime() {
    commitMaxTime = timeScale.invert(commitProgress);
}

// Filter commits based on current time
function filterCommitsByTime() {
    filteredCommits = commits.filter(commit => commit.datetime <= commitMaxTime);
    
    // Update counts based on filtered commits
    const countElement = document.getElementById('selection-count');
    if (countElement) {
        countElement.textContent = `${filteredCommits.length} of ${commits.length} commits shown`;
    }
    
    // Update language breakdown
    updateLanguageBreakdownFiltered(filteredCommits);
    
    // Update file visualization
    updateFileVisualization();
}

// Update the date display text
function updateDateDisplay() {
    // Update the time element
    const timeElement = document.getElementById('commit-time');
    timeElement.textContent = formatDateTime(commitMaxTime);
    
    // Also update the selectedTime span if present
    const selectedTimeElement = document.getElementById('selectedTime');
    if (selectedTimeElement) {
        selectedTimeElement.textContent = formatDateTime(commitMaxTime);
    }
}

// Format date for display
function formatDateTime(date) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// Modified language breakdown function to work with filtered commits
function updateLanguageBreakdownFiltered(filteredCommits) {
    const container = document.getElementById('language-breakdown');
  
    if (filteredCommits.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const lines = filteredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);
  
        container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }
  
    return breakdown;
}

// Updated scatterplot function that recreates the visualization with filtered commits
// Function to create and update file visualization
function updateFileVisualization() {
    // Get all lines from filtered commits
    let lines = filteredCommits.flatMap((d) => d.lines);
    
    // Group lines by file and create file objects
    let files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
            return { name, lines };
        });
    
    // Sort files by number of lines in descending order
    files = d3.sort(files, (d) => -d.lines.length);
    
    // Create color scale for file types
    let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
    
    // Create files container if it doesn't exist
    if (!document.querySelector('.files')) {
        const filesContainer = document.createElement('dl');
        filesContainer.className = 'files';
        document.querySelector('#chart').insertAdjacentElement('afterend', filesContainer);
        
        // Add heading for the section
        const heading = document.createElement('h2');
        heading.textContent = 'Files by Size';
        filesContainer.insertAdjacentElement('beforebegin', heading);
    }
    
    // Clear existing visualization
    d3.select('.files').selectAll('div').remove();
    
    // Create file entries
    let filesContainer = d3.select('.files').selectAll('div')
        .data(files)
        .enter()
        .append('div');
    
    // Add file name and line count
    filesContainer.append('dt')
        .append('code')
        .html(d => `${d.name} <small>${d.lines.length} lines</small>`);
    
    // Add dots for each line
    filesContainer.append('dd')
        .selectAll('div')
        .data(d => d.lines)
        .enter()
        .append('div')
        .attr('class', 'line')
        .style('background', d => fileTypeColors(d.type));
}

function updateScatterplot() {
    // Remove existing SVG
    d3.select('#chart svg').remove();
    
    // Sort commits by total lines in descending order
    const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);
    const width = 1000;
    const height = 600;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
      
    // Update scales with filtered commits
    xScale = d3
        .scaleTime()
        .domain(d3.extent(filteredCommits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);
    
    // Add gridlines BEFORE the axes
    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .call(xAxis);

    // Add Y axis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .call(yAxis);

    const dots = svg.append('g').attr('class', 'dots');

    // Update radius scale with filtered commits
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
        .style('--r', (d) => rScale(d.totalLines)) // Set CSS variable for transition duration
        .style('fill-opacity', 0.7) 
        .attr('fill', 'steelblue')
        .classed('selected', (d) => isCommitSelected(d))
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
        
    // Set up CSS in JavaScript since we can't modify the HTML
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        circle {
            transition: all 200ms, r calc(var(--r) * 10ms);
        }
        
        @starting-style {
            circle {
                r: 0;
            }
        }
    `;
    document.head.appendChild(styleElement);
    
    // Return the SVG for brush selector to use
    return svg;
}

// Add the displayStats function
function displayStats() {
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
    
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
    dl.append('dd').text(data.length);
    
    // Add total commits
    dl.append('dt').text('Total Commits');
    dl.append('dd').text(commits.length);

    let uniqueFiles = new Set(data.map(d => d.file)).size;
    dl.append('dt').text("Codebase File Count");
    dl.append('dd').text(uniqueFiles);

    let fileDepths = new Map();
    data.forEach(d => {
        fileDepths.set(d.file, d.depth); 
    });
    // Calculate the average depth
    let totalDepth = Array.from(fileDepths.values()).reduce((sum, depth) => sum + depth, 0);
    let avgDepth = fileDepths.size > 0 ? (totalDepth / fileDepths.size).toFixed(2) : 0; 
    dl.append('dt').text("Average File Depth");
    dl.append('dd').text(avgDepth);
    
    const timeCategories = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
    };
    // Categorize commits based on hour
    commits.forEach(commit => {
        let hour = commit.datetime.getHours(); 

        if (hour >= 6 && hour < 12) {
            timeCategories.morning++;
        } else if (hour >= 12 && hour < 18) {
            timeCategories.afternoon++;
        } else if (hour >= 18 && hour < 24) {
            timeCategories.evening++;
        } else {
            timeCategories.night++;
        }
    });

    // Find the time period with the highest count
    let mostActiveTime = Object.entries(timeCategories).reduce((a, b) => (a[1] > b[1] ? a : b))[0];

    dl.append('dt').text("Most Productivity in the Day");
    dl.append('dd').text(mostActiveTime);
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

let brushSelection = null;

function brushSelector() {
    const svg = document.querySelector('#chart svg');
    if (svg) {
        d3.select(svg).call(d3.brush().on('start brush end', brushed));
        d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
    }
}

function brushed(evt) {
    brushSelection = evt.selection;
    selectedCommits = !brushSelection
        ? []
        : filteredCommits.filter((commit) => { // Use filteredCommits instead of commits
            let min = { x: brushSelection[0][0], y: brushSelection[0][1] };
            let max = { x: brushSelection[1][0], y: brushSelection[1][1] };
            let x = xScale(commit.datetime);
            let y = yScale(commit.hourFrac);
    
            return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
        });
    
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
}

function isCommitSelected(commit) {
    return selectedCommits.includes(commit);
}

function updateSelection() {
    d3.selectAll('circle')
        .classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
        selectedCommits.length || 'No'
    } commits selected`;
}

function updateLanguageBreakdown() {
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : filteredCommits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);
  
        container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }
  
    return breakdown;
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
});