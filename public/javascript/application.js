// Setup graph data
const graph = parseData(data);
const { nodes, links, namespaces } = graph;

const max_lines = _.maxBy(nodes, "lines").lines;

const max_circle_r = 50;

// Setup SVG

const svg = d3.select(".dependency_graph svg");

const $svg = $(".dependency_graph svg");

const width = $svg.width();

const height = $svg.height();

const container = svg.append("g");

let currentScale = 1;

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
  .forceCharge(-1000); // Charge between the meta-nodes (Force template only)
// .forceNodeSize(forceNodeSize) // Used to compute the template force nodes size (Force template only)
// .forceNodeSize(10) // Used to compute the template force nodes size (Force template only)

// Setup Simulation
const simulation = d3
  .forceSimulation()
  .nodes(nodes)
  .force("group", groupingForce)
  .force("charge", d3.forceManyBody().strength(-1000))
  .force(
    "link",
    d3.forceLink(links).distance(2).strength(groupingForce.getLinkStrength)
  )
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("x", d3.forceX(width / 2))
  .force("y", d3.forceY(height / 2))
  .force("forceCollide", d3.forceCollide(80));

simulation.on("tick", function () {
  svg_links
    .attr("x1", function (d) {
      return d.source.x;
    })
    .attr("y1", function (d) {
      return d.source.y;
    })
    .attr("x2", function (d) {
      return d.target.x;
    })
    .attr("y2", function (d) {
      return d.target.y;
    });
  // .attr("style", `stroke-width: ${1.5 / currentScale}px`);

  svg_nodes
    .attr("cx", function (d) {
      return d.x;
    })
    .attr("cy", function (d) {
      return d.y;
    })
    .attr("transform", transform);
});

function transform(d) {
  return `translate(${d.x},${d.y})`;
}

// Add SVG Elements

// Draw links first so that nodes are drawn on top
const svg_links = container
  .append("g")
  .attr("class", "links")
  .selectAll(".link")
  .data(links)
  .enter()
  .append("line")
  .attr("class", function (d) {
    return "link " + classForCircular(d);
  });
// .attr("marker-end", function(d){ return "url(#" + d.target.id + ")"; });

const drag = d3
  .drag()
  .on("start", dragstarted)
  .on("drag", dragged)
  .on("end", dragended);

const svg_nodes = container
  .append("g")
  .attr("class", "nodes")
  .selectAll(".node")
  .data(nodes)
  .enter()
  .append("g")
  .attr("class", "node")
  .call(drag)
  .on("dblclick", dblclick);

function calcCircleRadius(d) {
  const dependents = d.dependents.length;
  let size = Math.min(dependents * 2 + 6, max_circle_r);
  if (currentScale > 1) {
    size = size / currentScale;
  }

  return size;
}

const circle = svg_nodes
  .append("circle")
  .attr("r", calcCircleRadius)
  .attr("class", function (d) {
    return `node-circle ${classForCircular(d)}`;
  });

function addTextStyle(d) {
  let size = Math.min(d.dependents.length * 2 + 12, 48);

  if (currentScale > 1) {
    size = size / currentScale;
  }

  return `font-size: ${size}px`;
}

const type = svg_nodes
  .append("text")
  .attr("class", "type")
  .attr("style", addTextStyle)
  .attr("x", "-0.4em")
  .attr("y", "0.4em")
  .text(function (d) {
    return d.type[0];
  });

function addTextOffset(d) {
  let offset = Math.min(d.dependents.length * 2 + 8, 48);

  if (currentScale > 1) {
    offset = offset / currentScale;
  }

  return offset;
}

const text = svg_nodes
  .append("text")
  .attr("class", "namespace")
  .attr("style", addTextStyle)
  .attr("x", addTextOffset)
  .attr("y", ".31em")
  .text(function (d) {
    return d.id;
  });

container
  .append("defs")
  .selectAll("marker")
  .data(nodes)
  .enter()
  .append("marker")
  .attr("id", function (d) {
    return d.id;
  })
  .attr("viewBox", "0 -5 10 10")
  .attr("refX", function (d) {
    return (d.lines / max_lines) * max_circle_r + 20;
  })
  .attr("refY", 0)
  .attr("markerWidth", 6)
  .attr("markerHeight", 6)
  .attr("orient", "auto")
  .append("path")
  .attr("d", "M0,-5L10,0L0,5");

// Set up Listeners

const zoom = d3.zoom().on("zoom", function () {
  currentScale = d3.event.transform.k;
  container.attr("transform", d3.event.transform);
  svg_links.attr("style", `stroke-width: ${1.5 / currentScale}px`);
  circle
    .attr("r", calcCircleRadius)
    .attr("style", `stroke-width: ${1.5 / currentScale}px`);
  text.attr("style", addTextStyle).attr("x", addTextOffset);
  type.attr("style", addTextStyle);
});

svg.call(zoom).on("dblclick.zoom", null);

svg_nodes.on("mouseover", function (d) {
  const relatives = [];
  svg_links.classed("downlighted", (l) => {
    if (d === l.source || d === l.target) {
      relatives.push(l.source);
      relatives.push(l.target);
      return false;
    } else {
      return true;
    }
  });
  svg_nodes.classed("downlighted", (n) => {
    return !(n == d || relatives.indexOf(n) > -1);
  });
});

svg_nodes.on("mouseout", function () {
  svg_links.classed("downlighted", false);
  svg_nodes.classed("downlighted", false);
});

// Set up global variables
const state = {
  get: () => {
    const positions = [];
    rubrowser.nodes.forEach((elem) => {
      if (elem.fx && elem.fy) {
        positions.push({
          id: elem.id,
          x: elem.fx,
          y: elem.fy,
        });
      }
    });
    return positions;
  },

  set: (layout) => {
    if (!layout) {
      return;
    }
    layout.forEach((pos) => {
      var definition = node.filter(function (e) {
        return e.id == pos.id;
      });
      definition.classed("fixed", true);

      var datum = definition.data()[0];
      if (datum) {
        datum.fx = pos.x;
        datum.fy = pos.y;
      }
    });
  },
};

window.rubrowser = {
  data: data,
  nodes: nodes,
  links: links,
  simulation: simulation,
  groupingForce: groupingForce,
  svg_nodes: svg_nodes,
  svg_links: svg_links,
  state: state,
};

rubrowser.state.set(layout);

// const gTemplate = container.append("g").attr("class", "template");

// simulation.force("group").drawTemplate(gTemplate);

simulation.alphaTarget(0.5).restart();

// End of Script --------------------------------

// Function definitions
function linkNodes(link, nodes) {
  const sourceIndex = nodes.findIndex((node) => node.id === link.sourceName);
  link.source = sourceIndex;
  nodes[sourceIndex].dependencies.push(link);

  const targetIndex = nodes.findIndex((node) => node.id === link.targetName);
  link.target = targetIndex;
  nodes[targetIndex].dependents.push(link);
}

function parseData(data) {
  const dup_definitions = data.definitions.map((d) => {
    return {
      id: d.namespace,
      file: d.file,
      type: d.type,
      lines: d.lines,
      line: d.line,
      circular: d.circular,
    };
  });

  const nodes = _(dup_definitions)
    .groupBy("id")
    .map((group) => {
      const files = group.map(function (d) {
        return d.file;
      });
      const relative_paths = group.map(function (d) {
        return d.relative_path;
      });
      const directory = files[0].substring(0, files[0].lastIndexOf("/"));
      return {
        id: group[0].id,
        name: group[0].id,
        type: group[0].type,
        lines: _(group).sumBy("lines"),
        line: group[0].line, // Is this the correct definition line?
        circular: group[0].circular,
        files: files,
        relative_paths: relative_paths,
        directory: directory,
        dependents: [],
        dependencies: [],
      };
    })
    .value();

  const namespaces = nodes.map((d) => d.id);

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

  const links = data.relations.reduce((links, relation) => {
    if (
      namespaces.includes(relation.caller) &&
      namespaces.includes(relation.resolved_namespace)
    ) {
      const link = {
        type: relation.type,
        sourceName: relation.caller,
        source: null,
        targetName: relation.resolved_namespace,
        target: null,
        file: relation.file,
        relative_path: relation.relative_path,
        line: relation.line,
        circular: relation.circular,
      };

      linkNodes(link, nodes);
      links.push(link);
    }
    return links;
  }, []);

  const uniqueLinks = _.uniqWith(links, _.isEqual);

  return {
    nodes: nodes,
    links: uniqueLinks,
    namespaces: namespaces,
  };
}

function classForCircular(d) {
  return d.circular ? "circular" : "";
}

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
