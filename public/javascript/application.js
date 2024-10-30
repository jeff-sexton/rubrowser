var classForCircular = function(d) {
  return d.circular ? 'circular' : '';
};
// const color = d3.scaleOrdinal(d3.schemeCategory10);

var svg = d3.select(".dependency_graph svg");

var $svg = $('.dependency_graph svg');

var width = $svg.width();

var height = $svg.height();

console.log("width", width);
console.log("height", height);

// var width = 1440,
//     height = 1440;

// var svg = d3.select(".dependency_graph svg")
//     .attr("width", width)
//     .attr("height", height);

var drag = d3.drag()
  .on("start", dragstarted)
  .on("drag", dragged)
  .on("end", dragended);

var dup_definitions = data.definitions.map(function(d){
  return {
    id: d.namespace,
    file: d.file,
    type: d.type,
    lines: d.lines,
    line: d.line,
    circular: d.circular
  };
});

var definitions = _(dup_definitions).groupBy('id').map(function(group) {
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
}).value();

var namespaces = definitions.map(function(d){ return d.id; });

var relations = data.relations.map(function(d){ return {source: d.caller, target: d.resolved_namespace, circular: d.circular}; });

var max_lines = _.maxBy(definitions, 'lines').lines;

var max_circle_r = 20;

/* 
  Relation Format:
  {  
    type: demoularize(relation.class.name),
    namespace: relation.namespace.to_s,
    resolved_namespace: relation.resolve(definitions).to_s,
    caller: relation.caller_namespace.to_s,
    file: relation.file,
    circular: relation.circular?,
    line: relation.line 
  }
*/

function definitionIndex (definitionId) {
  return definitions.findIndex((definition) => definition.id === definitionId);
}

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

// lines.forEach((line) => {
//   console.log("line", line);
// });


// definitions.forEach((definition) => {
//   console.log("definition", definition);
// });
relations = relations.filter(function(d){
  return namespaces.indexOf(d.source) >= 0 && namespaces.indexOf(d.target) >= 0;
});
relations = _.uniqWith(relations, _.isEqual);


// relations.forEach((relation) => {
//   console.log("relation", relation);
// });

const container = svg.append('g')

let currentScale = 1;
var zoom = d3.zoom()
    .on("zoom", function () {
      currentScale = d3.event.transform.k;
      container.attr("transform", d3.event.transform);
    });

svg.call(zoom)
  .on("dblclick.zoom", null);

// function parsePath(path) {
//   return path.split("/")
// }

// function calcStrength (link) {
//   console.log("link", link);
//   console.log("source", link.source.files[0]);
//   console.log("target", link.target.files[0]);
//   const path_difference = _.difference(parsePath(link.source.files[0]), parsePath(link.target.files[0]));
//   console.log("path_difference", path_difference);
//   const directory_difference = path_difference.length - 1;
//   console.log("directory_difference", directory_difference);
//   const strength = 1 - directory_difference * 0.25;
//   console.log("strength", strength);
//   // return 1;
//   return strength;
// };


// function calcDistance (link) {
//   console.log("link", link);
//   console.log("source", link.source.files[0]);
//   console.log("target", link.target.files[0]);
//   const path_difference = _.difference(parsePath(link.source.files[0]), parsePath(link.target.files[0]));
//   console.log("path_difference", path_difference);
//   const directory_difference = path_difference.length - 1;
//   console.log("directory_difference", directory_difference);
//   const distance = 100 + directory_difference * 100;
//   console.log("distance", distance);
//   // return 1;
//   return distance;
// };



// const simulation = d3.forceSimulation()
//   .force("link", d3.forceLink().id(function(d) { return d.id; }).strength(calcStrength).distance(calcDistance))
//   // .force("link", d3.forceLink().id(function(d) { return d.id; }).strength(calcStrength).distance(calcDistance))
//   .force("charge", d3.forceManyBody().strength(-100000))
//   .force("center", d3.forceCenter(width / 2, height / 2))
//   .force("forceCollide", d3.forceCollide(150));

// simulation
//   .nodes(definitions)
//   .on("tick", ticked);

// simulation.force("link")
//   .links(relations);

// Instantiate the forceInABox force
const groupingForce = forceInABox()
  .size([width, height]) // Size of the chart
  .template("force") // Either treemap or force
  .groupBy("directory") // Node attribute to group
  // .strength(forceInABoxStrength) // Strength to foci
  .strength(0.1) // Strength to foci
  .links(lines) // The graph links. Must be called after setting the grouping attribute
  .enableGrouping(true)
  // .linkStrengthInterCluster(linkStrengthInterCluster) // linkStrength between nodes of different clusters
  .linkStrengthInterCluster(0.001) // linkStrength between nodes of different clusters
  // .linkStrengthIntraCluster(linkStrengthIntraCluster) // linkStrength between nodes of the same cluster
  .linkStrengthIntraCluster(0.001) // linkStrength between nodes of the same cluster
  // .forceLinkDistance(forceLinkDistance) // linkDistance between meta-nodes on the template (Force template only)
  .forceLinkDistance(200) // linkDistance between meta-nodes on the template (Force template only)
  // .forceLinkStrength(forceLinkStrength) // linkStrength between meta-nodes of the template (Force template only)
  .forceLinkStrength(0.1) // linkStrength between meta-nodes of the template (Force template only)
  // .forceCharge(-forceCharge) // Charge between the meta-nodes (Force template only)
  .forceCharge(-1000) // Charge between the meta-nodes (Force template only)
  // .forceNodeSize(forceNodeSize) // Used to compute the template force nodes size (Force template only)
  // .forceNodeSize(10) // Used to compute the template force nodes size (Force template only)

const simulation = d3.forceSimulation()
  .nodes(definitions)
  .force("group", groupingForce)
  .force("charge", d3.forceManyBody().strength(-1000))
  .force("link", d3.forceLink(lines).distance(2).strength(groupingForce.getLinkStrength))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("x", d3.forceX(width / 2))
  .force("y", d3.forceY(height / 2))
  .force("forceCollide", d3.forceCollide(80))

simulation.on("tick", function() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .attr("style", `stroke-width: ${1.5 / currentScale}px`);

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("transform", transform);
});

function transform(d) {
  return "translate(" + d.x + "," + d.y + ")";
}

function addStyle (d) {
  // console.log("d", d);
  // console.log("d.lines", d.lines);
  // console.log("max_lines", max_lines);
  // console.log("size", size);
  let size = d.lines / max_lines * 120 + 18;
  // let size = d.lines + 12;

  size = 12
  return `font-size: ${size}px`;
};

// var link = svg.selectAll(".link")
//     .data(lines)
//   .enter().append("line")
//     .attr("class", "link")
//     .style("stroke-width", function(d) { return Math.sqrt(d.value); });

// var link = container.append("g")
//     .attr("class", "links")
//     .selectAll("path")
//     .data(relations)
//     .enter().append("path")
//     .attr("class", function(d) { return 'link ' + classForCircular(d); })
//     .attr("marker-end", function(d){ return "url(#" + d.target.id + ")"; })

var link = container.append("g")
    .attr("class", "links")
    .selectAll(".link")
    .data(lines)
    .enter().append("line")
    .attr("class", function(d) { return 'link ' + classForCircular(d); })
    // .attr("marker-end", function(d){ return "url(#" + d.target.id + ")"; });

// var node = svg.selectAll(".node")
//     .data(definitions)
//   .enter().append("circle")
//     .attr("class", "node")
//     .attr("r", 5)
//     .style("fill", function(d) { return color(d.group); })
//     .call(d3.drag()
//               .on("start", dragstarted)
//               .on("drag", dragged)
//               .on("end", dragended));

// node.append("title")
//     .text(function(d) { return d.id; });



// node = container.append("g")
// .attr("class", "nodes")
// .selectAll("g")
// .data(definitions)
// .enter().append("g")
// // .call(drag)
// // .on("dblclick", dblclick),
// circle = node
// .append("circle")
// .attr("r", function(d) { return d.lines / max_lines * max_circle_r + 6; })
// .attr("class", function (d) { return classForCircular(d) ; }),
// type = node
// .append("text")
// .attr("class", "type")
// .attr("x", "-0.4em")
// .attr("y", "0.4em")
// .text(function(d) { return d.type[0]; }),
// text = node
// .append("text")
// .attr("class", "namespace")
// .attr("style", addStyle) 
// .attr("x", function(d) { return d.lines / max_lines * max_circle_r + 8; })
// .attr("y", ".31em")
// .text(function(d) { return d.id; });

var node = container.append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(definitions)
    .enter().append("g")
    .attr("class", "node")
    .call(drag)
    .on("dblclick", dblclick);

var circle = node
    .append("circle")
    .attr("r", function(d) { return d.lines / max_lines * max_circle_r + 6; })
    .attr("class", function (d) { return `node-circle ${classForCircular(d)}` ; });

var type = node
    .append("text")
    .attr("class", "type")
    .attr("x", "-0.4em")
    .attr("y", "0.4em")
    .text(function(d) { return d.type[0]; });

var text = node
    .append("text")
    .attr("class", "namespace")
    .attr("style", addStyle) 
    .attr("x", function(d) { return d.lines / max_lines * max_circle_r + 8; })
    .attr("y", ".31em")
    .text(function(d) { return d.id; });

container.append("defs").selectAll("marker")
  .data(definitions)
  .enter().append("marker")
  .attr("id", function(d) { return d.id; })
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", function(d){ return d.lines / max_lines * max_circle_r + 20; })
  .attr("refY", 0)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M0,-5L10,0L0,5");



function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.select(this).classed("fixed", true);
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
}

function dblclick(d) {
  d3.select(this).classed("fixed", false);
  d.fx = null;
  d.fy = null;
}

var state = {
  get: function(){
    var positions = [];
    rubrowser.definitions.forEach(function(elem){
      if( elem.fx !== undefined && elem.fy !== undefined) {
        positions.push({
          id: elem.id,
          x: elem.fx,
          y: elem.fy
        });
      }
    });
    return positions;
  },

  set: function(layout){
    if ( !layout ) { return; }
    layout.forEach(function(pos) {
      var definition = node.filter(function(e) { return e.id == pos.id; })
      definition.classed("fixed", true);

      var datum = definition.data()[0]
      if( datum ) {
        datum.fx = pos.x
        datum.fy = pos.y
      }
    });
  }
}

node.on('mouseover', function(d) {
  var relatives = [];
  link.classed('downlighted', function(l) {
    if (d === l.source || d === l.target){
      relatives.push(l.source);
      relatives.push(l.target);
      return false;
    }else{
      return true;
    }
  });
  node.classed('downlighted', function(n) {
    return !(n == d || relatives.indexOf(n) > -1);
  });
});

node.on('mouseout', function() {
  link.classed('downlighted', false);
  node.classed('downlighted', false);
});

window.rubrowser = {
  data: data,
  definitions: definitions,
  relations: relations,
  simulation: simulation,
  groupingForce: groupingForce,
  node: node,
  link: link,
  state: state
};

rubrowser.state.set(layout);

// const gTemplate = container.append("g").attr("class", "template");

// simulation.force("group").drawTemplate(gTemplate);

simulation.alphaTarget(0.5).restart();
