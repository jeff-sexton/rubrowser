// Setup graph data
const graph = parseData(data);
const { nodes, links, namespaces } = graph;

const max_lines = _.maxBy(nodes, 'lines').lines;

const max_circle_r = 20;

// Setup SVG

const svg = d3.select(".dependency_graph svg");

const $svg = $('.dependency_graph svg');

const width = $svg.width();

const height = $svg.height();

const container = svg.append('g')

let currentScale = 1;

const zoom = d3.zoom()
    .on("zoom", function () {
      currentScale = d3.event.transform.k;
      container.attr("transform", d3.event.transform);
    });

svg.call(zoom)
  .on("dblclick.zoom", null);

const drag = d3.drag()
  .on("start", dragstarted)
  .on("drag", dragged)
  .on("end", dragended);

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
  .links(links) // The graph links. Must be called after setting the grouping attribute
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

// Setup Simulation
const simulation = d3.forceSimulation()
  .nodes(nodes)
  .force("group", groupingForce)
  .force("charge", d3.forceManyBody().strength(-1000))
  .force("link", d3.forceLink(links).distance(2).strength(groupingForce.getLinkStrength))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("x", d3.forceX(width / 2))
  .force("y", d3.forceY(height / 2))
  .force("forceCollide", d3.forceCollide(80))

simulation.on("tick", function() {
  svg_links.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; })
      .attr("style", `stroke-width: ${1.5 / currentScale}px`);

  svg_nodes.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })
      .attr("transform", transform);
});

function transform(d) {
  return "translate(" + d.x + "," + d.y + ")";
}

// Add SVG Elements

const svg_nodes = container.append("g")
    .attr("class", "nodes")
    .selectAll(".node")
    .data(nodes)
    .enter().append("g")
    .attr("class", "node")
    .call(drag)
    .on("dblclick", dblclick);

const circle = svg_nodes
    .append("circle")
    .attr("r", function(d) { return d.lines / max_lines * max_circle_r + 6; })
    .attr("class", function (d) { return `node-circle ${classForCircular(d)}` ; });

const type = svg_nodes
    .append("text")
    .attr("class", "type")
    .attr("x", "-0.4em")
    .attr("y", "0.4em")
    .text(function(d) { return d.type[0]; });

const text = svg_nodes
    .append("text")
    .attr("class", "namespace")
    .attr("style", addTextStyle) 
    .attr("x", function(d) { return d.lines / max_lines * max_circle_r + 8; })
    .attr("y", ".31em")
    .text(function(d) { return d.id; });

const svg_links = container.append("g")
    .attr("class", "links")
    .selectAll(".link")
    .data(links)
    .enter().append("line")
    .attr("class", function(d) { return 'link ' + classForCircular(d); })
    // .attr("marker-end", function(d){ return "url(#" + d.target.id + ")"; });

container.append("defs").selectAll("marker")
  .data(nodes)
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

// Set up Listeners

svg_nodes.on('mouseover', function(d) {
  const relatives = [];
  svg_links.classed('downlighted', (l) => {
    if (d === l.source || d === l.target){
      relatives.push(l.source);
      relatives.push(l.target);
      return false;
    }else{
      return true;
    }
  });
  svg_nodes.classed('downlighted', (n) => {
    return !(n == d || relatives.indexOf(n) > -1);
  });
});

svg_nodes.on('mouseout', function() {
  svg_links.classed('downlighted', false);
  svg_nodes.classed('downlighted', false);
});

// Set up global variables
const state = {
  get: () => {
    const positions = [];
    rubrowser.nodes.forEach((elem) => {
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

  set: (layout) => {
    if ( !layout ) { return; }
    layout.forEach((pos) => {
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

window.rubrowser = {
  data: data,
  nodes: nodes,
  links: links,
  simulation: simulation,
  groupingForce: groupingForce,
  svg_nodes: svg_nodes,
  svg_links: svg_links,
  state: state
};

rubrowser.state.set(layout);

// const gTemplate = container.append("g").attr("class", "template");

// simulation.force("group").drawTemplate(gTemplate);

simulation.alphaTarget(0.5).restart();

// End of Script --------------------------------

// Function definitions
function indexForNode (nodeId, nodes) {
  return nodes.findIndex((node) => node.id === nodeId);
}

function parseData(data) {

  const dup_definitions = data.definitions.map((d) => {
    return {
      id: d.namespace,
      file: d.file,
      type: d.type,
      lines: d.lines,
      line: d.line,
      circular: d.circular
    };
  });

  const nodes = _(dup_definitions).groupBy('id').map((group) => {
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


  const namespaces = nodes.map((d) => d.id );

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

const formatted_links = data.relations.map((relation) => {
  return {
    type: relation.type,
    sourceName: relation.caller,
    source: indexForNode(relation.caller, nodes),
    targetName: relation.resolved_namespace,
    target: indexForNode(relation.resolved_namespace, nodes),
    file: relation.file,
    line: relation.line,
    circular: relation.circular,
  }
}).filter((relation) => {
  return namespaces.indexOf(relation.sourceName) >= 0 && namespaces.indexOf(relation.targetName) >= 0;
})

const links = _.uniqWith(formatted_links, _.isEqual);


  return {
    nodes: nodes,
    links: links,
    namespaces: namespaces,
  }

}

function classForCircular (d) {
  return d.circular ? 'circular' : '';
};

function addTextStyle (d) {
  // console.log("d", d);
  // console.log("d.lines", d.lines);
  // console.log("max_lines", max_lines);
  // console.log("size", size);
  let size = d.lines / max_lines * 120 + 18;
  // let size = d.lines + 12;

  size = 12
  return `font-size: ${size}px`;
};

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
