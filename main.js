let imageData;
const tooltipPadding = 15;

const resizeAndRender = () => {
    d3.selectAll("svg > *").remove();

    d3.selectAll("#full-temporal-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("full-temporal-visualization-container").clientWidth, 1.3 * document.getElementById("full-temporal-visualization").clientHeight]));

    d3.selectAll("#city-day-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("watch-visualization-container").clientWidth, 1.3 * document.getElementById("watch-visualization").clientHeight]));

    d3.selectAll("#content-reason-visualization")
        .style("height", "50vh")
        .attr("width", d3.max([document.getElementById("hour-temporal-visualization-container").clientWidth, 1.3 * document.getElementById("hour-temporal-visualization").clientHeight]));

    d3.selectAll(".visualization-container")
        .style("border-radius", 0.06 * document.getElementById("full-temporal-visualization").clientHeight + "px")

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
        top: 0.04 * containerHeight,
        right: 0.04 * containerWidth,
        bottom: 0.1 * containerHeight,
        left: 0.08 * containerWidth
    };

    const width = containerWidth - (margin.right + margin.left);
    const height = containerHeight - (margin.top + margin.bottom);

    const svg = d3.select("#full-temporal-visualization");
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
        if (image.datetime > dayjs("2025-05-26 22:00:00") && image.datetime < dayjs("2025-05-29 16:45:00")) {
            image.place = "Toronto";
        } else if (image.datetime > dayjs("2025-05-30 11:50:00") && image.datetime < dayjs("2025-06-01 08:00:00")) {
            image.place = "Amsterdam"
        } else if (image.datetime > dayjs("2025-06-01 15:30:00") && image.datetime < dayjs("2025-06-06 18:10:00")) {
            image.place = "Luxembourg"
        } else if (image.datetime > dayjs("2025-06-06 23:45:00") && image.datetime < dayjs("2025-06-09 11:15:00")) {
            image.place = "Oslo"
        } else {
            image.place = "Travel"
        }
    });

    //resizeAndRender();
});