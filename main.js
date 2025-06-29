let imageData;
const tooltipPadding = 15;

const times = [
    {start: dayjs("2025-05-26 22:00:00"), end: dayjs("2025-05-29 16:45:00"), place: "Toronto"},
    {start: dayjs("2025-05-30 11:50:00"), end: dayjs("2025-06-01 08:00:00"), place: "Amsterdam"},
    {start: dayjs("2025-06-01 15:30:00"), end: dayjs("2025-06-06 18:10:00"), place: "Luxembourg"},
    {start: dayjs("2025-06-06 23:45:00"), end: dayjs("2025-06-09 11:15:00"), place: "Oslo"},
]

const resizeAndRender = () => {
    d3.selectAll("svg > *").remove();

    d3.selectAll("#full-temporal-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("full-temporal-visualization-container").clientWidth, 1.3 * document.getElementById("full-temporal-visualization").clientHeight]));

    d3.selectAll("#city-day-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("city-day-visualization-container").clientWidth, 1.3 * document.getElementById("city-day-visualization").clientHeight]));

    d3.selectAll("#content-reason-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("content-reason-visualization-container").clientWidth, 1.3 * document.getElementById("content-reason-visualization").clientHeight]));

    renderVisualization();

    d3.selectAll("text")
        .attr("font-size", function() { return d3.select(this).attr("text-multiplier") * 0.008 * document.getElementById("full-temporal-visualization").clientWidth });

    d3.select("#tooltip")
        .style("border-radius", 0.02 * document.getElementById("full-temporal-visualization").clientHeight + "px")

    d3.select("#disclaimer")
        .style("display", +d3.select("svg").attr("width") > window.innerWidth ? "block" : "none");
};

window.onresize = resizeAndRender;

const setTooltip = (selection, innerHtml) => {
    selection
        .on('mouseover', (event, d) => {
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px')
                .html(innerHtml(d));
        })
        .on("mousemove", (event, d) => {
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px');
        })
        .on('mouseleave', () => {
            d3.select("#tooltip").style("display", "none");
        });
};

const setupFullTemporalVisualization = () => {
    const containerWidth = document.getElementById("full-temporal-visualization").clientWidth;
    const containerHeight = document.getElementById("full-temporal-visualization").clientHeight;

    const margin = {
        top: 0.00 * containerHeight,
        right: 0.00 * containerWidth,
        bottom: 0.0 * containerHeight,
        left: 0.00 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#full-temporal-visualization");
    const topChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    const middleChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top + 5 * height / 11})`);
    const bottomChartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top + 6 * height / 11})`);

    const contentCategories = [...new Set(imageData.map(d => d.contents))];
    const reasonCategories = [...new Set(imageData.map(d => d.reason))];

    const dateDomain = [dayjs("2025-05-25 00:00:00"), dayjs("2025-06-11 00:00:00")];
    const contentBins = [];
    const reasonBins = [];
    const timeMiddles = [];
    const interval = 24;

    let currentTime = dateDomain[0];
    while (currentTime < dateDomain[1]) {
        contentCategories.forEach(cc => {
            contentBins.push({ category: cc, start: currentTime, middle: currentTime.add(interval / 2, "h"), end: currentTime.add(interval, "h"), count: 0 });
        });
        reasonCategories.forEach(rc => {
            reasonBins.push({ category: rc, start: currentTime, middle: currentTime.add(interval / 2, "h"), end: currentTime.add(interval, "h"), count: 0 });
        });
        timeMiddles.push(currentTime.add(interval / 2, "h"));

        currentTime = currentTime.add(interval, "h");
    }

    imageData.forEach(d => {
        contentBins.forEach(cb => {
            if (d.datetime > cb.start && d.datetime < cb.end && d.contents === cb.category) {
                cb.count += 1;
            }
        });
        reasonBins.forEach(rb => {
            if (d.datetime > rb.start && d.datetime < rb.end && d.reason === rb.category) {
                rb.count += 1;
            }
        });
    });

    const chartHeight = 5 * height / 11; 

    const xScale = d3.scaleTime()
        .domain([dayjs("2025-05-25 12:00:00"), dayjs("2025-06-10 12:00:00")])
        .range([width / 5, width]);
    const yScale = d3.scaleLinear()
        .domain([-47, 47])
        .range([chartHeight, 0]);
        
    const contentStackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(contentCategories)
        .value(([, group], key) => group.get(key).count)
        (d3.index(contentBins, d => d.middle, d => d.category))
        .map((data, i) => { return { category: contentCategories[i], data: data }; });
        
    const reasonStackedData = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(reasonCategories)
        .value(([, group], key) => group.get(key).count)
        (d3.index(reasonBins, d => d.middle, d => d.category))
        .map((data, i) => { return { category: reasonCategories[i], data: data }; });

    var area = d3.area()
        .x((_, i) => xScale(timeMiddles[i]))
        .y0((d) => yScale(d[0]))
        .y1((d) => yScale(d[1]))
        .curve(d3.curveBumpX);

    let rowHeight = chartHeight / contentCategories.length;
    contentCategories.forEach((cc, i) => {
        topChartArea.append("circle")
            .attr("r", height / 45)
            .attr("cx", height / 45)
            .attr("cy", i * rowHeight + rowHeight / 2)
            .attr("fill", ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"][i]);
        
        topChartArea.append("text")
            .attr("transform", `translate(${height / 15}, ${i * rowHeight + rowHeight / 2})`)
            .attr("text-multiplier", 1.5)
            .attr("dominant-baseline", "middle")
            .text(cc + ` (total: ${imageData.filter(i => i.contents === cc).length})`);
    });
    
    topChartArea.selectAll(".layer")
        .data(contentStackedData)    
        .join("path")
        .attr("class", "layer")
        .attr("fill", (_, i) => ["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e","#e6ab02","#a6761d","#666666"][i])
        .attr("d", d => area(d.data))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .on('mouseover', function(event, d) {
            d3.select(this).attr("stroke-width", 1).raise();

            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px')
                .html(`<b>${d.category}</b><br>
                    <i>Count: ${imageData.filter(i => i.contents === d.category).length}</i>`);
        })
        .on("mousemove", (event, d) => {
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px');
        })
        .on('mouseleave', function() {
            d3.select(this).attr("stroke-width", 0);

            d3.select("#tooltip").style("display", "none");
        });

    rowHeight = chartHeight / reasonCategories.length;
    reasonCategories.forEach((rc, i) => {
        bottomChartArea.append("circle")
            .attr("r", height / 45)
            .attr("cx", height / 45)
            .attr("cy", i * rowHeight + rowHeight / 2)
            .attr("fill", ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f","#bf5b17","#666666"][i]);
        
        bottomChartArea.append("text")
            .attr("transform", `translate(${height / 15}, ${i * rowHeight + rowHeight / 2})`)
            .attr("text-multiplier", 1.5)
            .attr("dominant-baseline", "middle")
            .text(rc + ` (total: ${imageData.filter(i => i.reason === rc).length})`);
    });
    
    bottomChartArea.selectAll(".layer")
        .data(reasonStackedData)    
        .join("path")
        .attr("class", "layer")
        .attr("fill", (_, i) => ["#7fc97f","#beaed4","#fdc086","#ffff99","#386cb0","#f0027f","#bf5b17","#666666"][i])
        .attr("d", d => area(d.data))
        .attr("stroke", "black")
        .attr("stroke-width", 0)
        .on('mouseover', function(event, d) {
            d3.select(this).attr("stroke-width", 1).raise();

            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px')
                .html(`<b>${d.category}</b><br>
                    <i>Count: ${imageData.filter(i => i.reason === d.category).length}</i>`);
        })
        .on("mousemove", (event, d) => {
            d3.select("#tooltip")
                .style("display", "block")
                .style("left", (event.pageX + tooltipPadding) + 'px')
                .style("top", (event.pageY + tooltipPadding) + 'px');
        })
        .on('mouseleave', function() {
            d3.select(this).attr("stroke-width", 0);

            d3.select("#tooltip").style("display", "none");
        });

    middleChartArea.selectAll(".line")
        .data(times)
        .join("line")
        .attr("class", "line")
        .attr("x1", t => xScale(t.start))
        .attr("x2", t => xScale(t.end))
        .attr("y1", height / 33)
        .attr("y2", height / 33)
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    middleChartArea.selectAll(".line-end")
        .data([].concat(...times.map(t => [t.start, t.end])))
        .join("line")
        .attr("class", "end")
        .attr("x1", t => xScale(t))
        .attr("x2", t => xScale(t))
        .attr("y1", height / 66)
        .attr("y2", height / 22)
        .attr("stroke", "black")
        .attr("stroke-width", 1);

    middleChartArea.selectAll(".text")
        .data(times)
        .join("text")
        .attr("class", "text")
        .attr("transform", t => `translate(${(xScale(t.end) + xScale(t.start)) / 2}, ${height / 17})`)
        .attr("text-anchor", "middle")
        .attr("text-multiplier", 1.5)
        .text(t => t.place);
};

const setupCityDayVisualization = () => {
    const containerWidth = document.getElementById("watch-visualization").clientWidth;
    const containerHeight = document.getElementById("watch-visualization").clientHeight;

    const margin = {
        top: 0.04 * containerHeight,
        right: 0.04 * containerWidth,
        bottom: 0.1 * containerHeight,
        left: 0.08 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#watch-visualization");
    const chartArea = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const xAxisG = chartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr("transform", `translate(0, ${height})`);

    const yAxisG = chartArea.append('g')
        .attr('class', 'axis y-axis')

    const fitnessData = boxingData.filter(d => "calories" in d);

    const xScale = d3.scaleLinear()
        .domain([d3.min(fitnessData, d => d.calories) - 10, d3.max(fitnessData, d => d.calories) + 10])
        .range([0, width]);
    const yScale = d3.scaleLinear()
        .domain([d3.min(fitnessData, d => d.avghr) - 5, d3.max(fitnessData, d => d.avghr) + 5])
        .range([height, 0]);

    const xAxis = d3.axisBottom(xScale)
        .ticks(8)
        .tickSize(-height)
        .tickSizeOuter(0)
        .tickPadding(10);
    const yAxis = d3.axisLeft(yScale)
        .ticks(5)
        .tickSize(-width)
        .tickSizeOuter(0)
        .tickPadding(10);
    
    const points = chartArea.selectAll(".class-circle")
        .data(fitnessData)    
        .join("circle")
        .attr("class", "class-circle")
        .attr("fill", "#A54657")
        .attr("cx", d => xScale(d.calories))
        .attr("cy", d => yScale(d.avghr))
        .attr("fill-opacity", 0.7)
        .attr("r", width * 0.012);
    setTooltip(points, 
        d => `<b>${dayjs(d.date).format("MMMM D, YYYY")} at ${d.time}</b><br>
            <i>Instructor: ${d.instructor.split(" ").join(" & ")}</i><br>
            <i>Calories Burned: ${d.calories}</i><br>
            <i>Average Heart Rate: ${d.avghr} BPM</i>`);

    chartArea.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom * 0.75)
        .attr("text-multiplier", 2)
        .attr("text-anchor", "middle")
        .text("Calories Burned")

    chartArea.append("text")
        .attr("transform", `rotate(${-90})`)
        .attr("x", -height / 2)
        .attr("y", -margin.left * 0.5)
        .attr("text-multiplier", 2)
        .attr("text-anchor", "middle")
        .text("Average Heart Rate (BPM)")

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);

    chartArea.selectAll(".axis text").attr("text-multiplier", 1.25);
};

const setupContentReasonVisualization = () => {
};

const renderVisualization = () => {
    setupFullTemporalVisualization();
    // setupCityDayVisualization();
    // setupContentReasonVisualization();
};

Promise.all([d3.json('data/image-data-3-with-colours.json')]).then(([_imageData]) => {
    imageData = _imageData;
    imageData.forEach(image => {
        image.datetime = dayjs(image.datetime.split(" ").map((c, i) => i === 0 ? c.replaceAll(":", "-") : c).join(" "));
        image.place = "Travel";
        times.forEach(time => {
            if (image.datetime > time.start && image.datetime < time.end) {
                image.place = time.place;
            }
        });
    });

    resizeAndRender();
});