import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
let data = [];
let commits = [];
let selectedCommits = [];
let filteredCommits = []; // Filtered commits for visualization
let visibleCommits = []; // Visible commits in scrollytelling
let xScale, yScale;

// Scrollytelling variables
let NUM_ITEMS = 0; // Will be set to commits.length
let ITEM_HEIGHT = 150; // Increased height for narrative
let VISIBLE_COUNT = 6; // Number of visible items
let totalHeight = 0; // Will be calculated

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), 
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));
    
    // Process commits first
    processCommits();
    
    // Sort commits chronologically for the scrollytelling
    commits = d3.sort(commits, d => d.datetime);
    
    // Set scrollytelling variables based on commit data
    NUM_ITEMS = commits.length;
    totalHeight = NUM_ITEMS * ITEM_HEIGHT;
    
    // Initialize scrollytelling
    initializeScrollytelling();
    
    // Initial filtered commits is all commits
    filteredCommits = [...commits];
    
    // Display statistics
    displayStats();
    
    // Create initial scatterplot with all commits
    updateScatterplot(filteredCommits);
    
    // Initialize brush selector
    brushSelector();
    
    // Create file visualization
    displayCommitFiles();
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

function initializeScrollytelling() {
    // Set up spacer height
    const spacer = d3.select('#spacer');
    spacer.style('height', `${totalHeight}px`);
    
    // Add scroll event listener
    const scrollContainer = d3.select('#scroll-container');
    scrollContainer.on('scroll', () => {
        const scrollTop = scrollContainer.property('scrollTop');
        let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
        startIndex = Math.max(0, Math.min(startIndex, commits.length - VISIBLE_COUNT));
        renderItems(startIndex);
    });
    
    // Initial render
    renderItems(0);
}

function renderItems(startIndex) {
    // Clear previous items
    const itemsContainer = d3.select('#items-container');
    itemsContainer.selectAll('div').remove();
    
    // Get visible commits
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
    visibleCommits = commits.slice(startIndex, endIndex);
    
    // Update visualization with visible commits
    updateScatterplot(visibleCommits);
    
    // Update file visualization
    displayCommitFiles();
    
    // Render new items
    const items = itemsContainer.selectAll('div')
        .data(visibleCommits)
        .enter()
        .append('div')
        .attr('class', 'item')
        .style('position', 'absolute')
        .style('top', (_, idx) => `${idx * ITEM_HEIGHT}px`)
        .style('width', 'calc(100% - 20px)');
    
    // Add commit narrative
    items.html((d, i) => `
        <p>
            On ${d.datetime.toLocaleString("en", {dateStyle: "full", timeStyle: "short"})}, I made
            <a href="${d.url}" target="_blank">
                ${i + startIndex > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'}
            </a>. 
            I edited ${d.totalLines} lines across 
            ${d3.rollups(d.lines, D => D.length, d => d.file).length} files. 
            Then I looked over all I had made, and I saw that it was very good.
        </p>
        <p>
            This commit ${i + startIndex === 0 ? 'started' : 'continued'} the journey of building this website, 
            focusing on ${getMostEditedFileType(d.lines)} files during this session.
        </p>
    `);
}

// Helper function to get the most edited file type in a commit
function getMostEditedFileType(lines) {
    const typeCount = d3.rollup(lines, v => v.length, d => d.type);
    let maxType = '';
    let maxCount = 0;
    
    for (const [type, count] of typeCount) {
        if (count > maxCount) {
            maxCount = count;
            maxType = type;
        }
    }
    
    return maxType;
}

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

function updateScatterplot(commits) {
    // Remove existing SVG
    d3.select('#chart svg').remove();
    
    // If no commits, don't create chart
    if (commits.length === 0) return;
    
    // Sort commits by total lines in descending order
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    const width = 500;
    const height = 500;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    const margin = { top: 10, right: 10, bottom: 30, left: 40 };

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
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([usableArea.left, usableArea.right])
        .nice();

    yScale = d3
        .scaleLinear()
        .domain([0, 24])
        .range([usableArea.bottom, usableArea.top]);
    
    // Add gridlines
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
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([3, 30]);

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
        
    // Set up CSS
    if (!document.querySelector('style#circle-transitions')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'circle-transitions';
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
    }
    
    // Update count element
    const countElement = document.getElementById('selection-count');
    if (countElement) {
        countElement.textContent = `${commits.length} of ${commits.length} commits shown`;
    }
    
    return svg;
}

function displayCommitFiles() {
    // Get lines from visible commits
    const lines = visibleCommits.flatMap((d) => d.lines);
    
    // If no lines, don't display
    if (lines.length === 0) return;
    
    // Create color scale for file types
    let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
    
    // Group lines by file and create file objects
    let files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
            return { name, lines };
        });
    
    // Sort files by number of lines in descending order
    files = d3.sort(files, (d) => -d.lines.length);
    
    // Create files container if it doesn't exist
    if (!document.querySelector('.files')) {
        const filesContainer = document.createElement('dl');
        filesContainer.className = 'files';
        document.body.appendChild(filesContainer);
        
        // Add heading for the files section
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
        .html(d => `<code>${d.name}</code><small>${d.lines.length} lines</small>`);
    
    // Add dots for each line
    filesContainer.append('dd')
        .selectAll('div')
        .data(d => d.lines)
        .enter()
        .append('div')
        .attr('class', 'line')
        .style('background', d => fileTypeColors(d.type));
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
        : visibleCommits.filter((commit) => {
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
    
    const lines = selectedCommits.flatMap((d) => d.lines);
  
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