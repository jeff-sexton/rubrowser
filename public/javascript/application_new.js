console.log("hello from application.js");
const dup_definitions = data.definitions.map(function(d){
  return {
    id: d.namespace,
    file: d.file,
    type: d.type,
    lines: d.lines,
    line: d.line,
    circular: d.circular
  };
})

const definitions = _(dup_definitions).groupBy('id').map(function(group) {
  const files = group.map(function(d){ return d.file; })
  const directory = files[0].split("/").slice(0, -1).join("/");
  return {
    id: group[0].id,
    name: group[0].id,
    type: group[0].type,
    lines: _(group).sumBy('lines'),
    line: group[0].line, // Is this the correct definition line?
    circular: group[0].circular,
    files: files,
    directory: directory,
  };
}).value()

const namespaces = definitions.map(function(d){ return d.id; });

function definitionIndex (definitionId) {
  return definitions.findIndex((definition) => definition.id === definitionId);
};

const formatted_lines = data.relations.map((relation) => {
  return {
    type: relation.type,
    sourceName: relation.caller,
    source: definitionIndex(relation.caller),
    targetName: relation.resolved_namespace,
    target: definitionIndex(relation.resolved_namespace),
    file: relation.file,
    line: relation.line,
    circular: relation.circular,
  }
}).filter((relation) => {
  return namespaces.indexOf(relation.sourceName) >= 0 && namespaces.indexOf(relation.targetName) >= 0;
})

const lines = _.uniqWith(formatted_lines, _.isEqual);

console.log("definitions", definitions);
console.log("lines", lines);

var useGroupInABox = false,
  drawTemplate = false,
  template = "force";

d3.select("#checkGroupInABox").property("checked", useGroupInABox);
d3.select("#checkShowTreemap").property("checked", drawTemplate);
d3.select("#selectTemplate").property("value", template);

var width = 600,
    height = 400;

var color = d3.scaleOrdinal(d3.schemeCategory20);

var force = d3.forceSimulation()
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX(width/2).strength(0.05))
    .force("y", d3.forceY(height/2).strength(0.05));

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var groupingForce = forceInABox()
        .strength(0.2) // Strength to foci
        .template(template) // Either treemap or force
        .groupBy("directory") // Node attribute to group
        .links(lines) // The graph links. Must be called after setting the grouping attribute
        .enableGrouping(useGroupInABox)
        .nodeSize(4)
        .linkStrengthIntraCluster(0.01)
        .size([width, height]) // Size of the chart
force
    .nodes(definitions)
    .force("group", groupingForce)
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink(lines)
      .distance(10)
      .strength(groupingForce.getLinkStrength)
    );


var link = svg.selectAll(".link")
    .data(lines)
  .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function(d) { return Math.sqrt(d.value); });

var node = svg.selectAll(".node")
    .data(definitions)
  .enter().append("circle")
    .attr("class", "node")
    .attr("r", 5)
    .style("fill", function(d) { return color(d.group); })
    .call(d3.drag()
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));

node.append("title")
    .text(function(d) { return d.id; });

force.on("tick", function() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
});

d3.select("#checkGroupInABox").on("change", onCheckGroupInABox);

d3.select("#selectTemplate").on("change", function () {
  template = d3.select("#selectTemplate").property("value");
  force.stop();
  force.force("group").template(template);
  force.alphaTarget(0.5).restart();
});

d3.select("#checkShowTreemap").on("change", function () {
  drawTemplate = d3.select("#checkShowTreemap").property("checked");
  if (drawTemplate) {
    force.force("group").drawTemplate(svg);
  } else {
    force.force("group").deleteTemplate(svg);
  }
});

setTimeout(function() {
  d3.select("#checkGroupInABox").property("checked", true);
  onCheckGroupInABox();
}, 2000);

function dragstarted(d) {
  if (!d3.event.active) force.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) force.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

function onCheckGroupInABox() {
  force.stop();
  useGroupInABox = d3.select("#checkGroupInABox").property("checked");
  force
      // .force("link", d3.forceLink(graph.links).distance(50).strength(
      // function (l) { return !useGroupInABox? 0.7 :
      //     l.source.group!==l.target.group ? 0 : 0.1;
      // }))
      .force("group").enableGrouping(useGroupInABox)

  force.alphaTarget(0.5).restart();
}
