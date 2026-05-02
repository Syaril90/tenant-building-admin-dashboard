import type { StrataNodeType, StrataTreeNode, StrataUploadMeta } from "./types";

export class ImportValidationError extends Error {
  details: string[];

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "ImportValidationError";
    this.details = details;
  }
}

export function splitDocuments(value: string) {
  return value
    .split(/[|,]/)
    .map((item) => item.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function normalizeTree(nodes: StrataTreeNode[]) {
  return nodes.map(normalizeNode);
}

export function normalizeNode(node: StrataTreeNode): StrataTreeNode {
  const children = node.children ? node.children.map(normalizeNode) : undefined;

  return {
    ...node,
    children,
    countsLabel: buildCountsLabel(node.type, children)
  };
}

export function updateNodeById(
  nodes: StrataTreeNode[],
  nodeId: string,
  updater: (node: StrataTreeNode) => StrataTreeNode
): StrataTreeNode[] {
  return normalizeTree(
    nodes.map((node) => {
      if (node.id === nodeId) {
        return updater(node);
      }

      if (node.children?.length) {
        return {
          ...node,
          children: updateNodeById(node.children, nodeId, updater)
        };
      }

      return node;
    })
  );
}

export function insertChildNode(
  nodes: StrataTreeNode[],
  parentId: string,
  childNode: StrataTreeNode
): StrataTreeNode[] {
  return normalizeTree(
    nodes.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children ?? []), childNode]
        };
      }

      if (node.children?.length) {
        return {
          ...node,
          children: insertChildNode(node.children, parentId, childNode)
        };
      }

      return node;
    })
  );
}

export function removeNodeById(nodes: StrataTreeNode[], nodeId: string): StrataTreeNode[] {
  return normalizeTree(
    nodes
      .filter((node) => node.id !== nodeId)
      .map((node) => ({
        ...node,
        children: node.children ? removeNodeById(node.children, nodeId) : undefined
      }))
  );
}

export function mergeTreeCollections(current: StrataTreeNode[], incoming: StrataTreeNode[]) {
  const merged = [...current.map(cloneNode)];

  incoming.forEach((nextBuilding) => {
    const existingIndex = merged.findIndex((item) => item.code === nextBuilding.code);

    if (existingIndex === -1) {
      merged.push(cloneNode(nextBuilding));
      return;
    }

    merged[existingIndex] = mergeTreeNode(merged[existingIndex], nextBuilding);
  });

  return normalizeTree(merged);
}

export function removeUploadsForNode(
  uploadsByNode: Record<string, StrataUploadMeta[]>,
  nodeId: string
) {
  const nextUploads = { ...uploadsByNode };
  delete nextUploads[nodeId];
  return nextUploads;
}

export function parseJsonTree(text: string) {
  let parsed: { tree?: StrataTreeNode[] } | StrataTreeNode[];

  try {
    parsed = JSON.parse(text) as { tree?: StrataTreeNode[] } | StrataTreeNode[];
  } catch {
    throw new ImportValidationError("Invalid JSON file.", [
      "The file could not be parsed as JSON.",
      "Check for missing commas, quotes, or trailing characters."
    ]);
  }
  const tree = Array.isArray(parsed) ? parsed : parsed.tree;

  if (!tree || !Array.isArray(tree)) {
    throw new ImportValidationError("Invalid strata JSON format.", [
      "Expected a top-level `tree` array or an array of building nodes."
    ]);
  }

  return normalizeTree(tree);
}

export function parseCsvTree(text: string) {
  if (!text.trim()) {
    throw new ImportValidationError("CSV file is empty.", [
      "Add at least one header row and one data row."
    ]);
  }

  const [headerRow, ...rows] = text.trim().split(/\r?\n/);
  const headers = headerRow.split(",").map((value) => cleanCsvValue(value));
  const recordMap = new Map<string, string>();
  const buildings: StrataTreeNode[] = [];
  const requiredHeaders = [
    "building_code",
    "building_name",
    "area_code",
    "area_name",
    "unit_code",
    "unit_name"
  ];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new ImportValidationError("Missing required CSV columns.", missingHeaders);
  }

  rows.forEach((row, rowIndex) => {
    if (!row.trim()) {
      return;
    }

    const values = row.split(",").map((value) => cleanCsvValue(value));
    recordMap.clear();
    headers.forEach((header, index) => {
      recordMap.set(header, values[index] ?? "");
    });

    const buildingCode = recordMap.get("building_code") ?? "";
    if (!buildingCode) {
      throw new ImportValidationError("CSV row is missing building_code.", [
        `Row ${rowIndex + 2}: building_code is required.`
      ]);
    }

    let building = buildings.find((item) => item.code === buildingCode);
    if (!building) {
      building = {
        id: `building-${slugify(buildingCode)}`,
        type: "building",
        name: recordMap.get("building_name") ?? buildingCode,
        code: buildingCode,
        status: recordMap.get("building_status") ?? "Imported building",
        countsLabel: "",
        documentsExpected: splitDocuments(recordMap.get("building_documents") ?? ""),
        children: []
      };
      buildings.push(building);
    }

    const areaCode = recordMap.get("area_code") ?? "";
    let area: StrataTreeNode | undefined;
    if (areaCode) {
      area = building.children?.find((item) => item.code === areaCode);
      if (!area) {
        area = {
          id: `area-${slugify(areaCode)}`,
          type: "area",
          name: recordMap.get("area_name") ?? areaCode,
          code: areaCode,
          status: recordMap.get("area_status") ?? "Imported area",
          countsLabel: "",
          documentsExpected: splitDocuments(recordMap.get("area_documents") ?? ""),
          children: []
        };
        building.children?.push(area);
      }
    }

    const unitCode = recordMap.get("unit_code") ?? "";
    if (unitCode) {
      const unit: StrataTreeNode = {
        id: `unit-${slugify(unitCode)}`,
        type: "unit",
        name: recordMap.get("unit_name") ?? unitCode,
        code: unitCode,
        status: recordMap.get("unit_status") ?? "Imported unit",
        countsLabel: "",
        documentsExpected: splitDocuments(recordMap.get("unit_documents") ?? "")
      };

      if (area) {
        const exists = area.children?.some((item) => item.code === unit.code);
        if (!exists) {
          area.children?.push(unit);
        }
      } else {
        const exists = building.children?.some((item) => item.code === unit.code);
        if (!exists) {
          building.children?.push(unit);
        }
      }
    } else {
      throw new ImportValidationError("CSV row is missing unit_code.", [
        `Row ${rowIndex + 2}: unit_code is required to create a unit row.`
      ]);
    }
  });

  if (buildings.length === 0) {
    throw new ImportValidationError("CSV file did not produce any building nodes.", [
      "Check that building_code and unit_code columns are populated."
    ]);
  }

  return normalizeTree(buildings);
}

export function validateTree(nodes: StrataTreeNode[]) {
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const details: string[] = [];

  function walk(node: StrataTreeNode, parentType?: StrataNodeType) {
    if (!node.id || !node.code || !node.name) {
      details.push(`Node missing id, code or name: ${node.code || node.id || "unknown"}`);
    }

    if (seenIds.has(node.id)) {
      details.push(`Duplicate node id found: ${node.id}`);
    }

    if (seenCodes.has(node.code)) {
      details.push(`Duplicate node code found: ${node.code}`);
    }

    if (parentType === "unit") {
      details.push(`Unit nodes cannot contain children: ${node.code}`);
    }

    if (parentType === "area" && node.type === "building") {
      details.push(`Area cannot contain a building node: ${node.code}`);
    }

    if (parentType === "building" && node.type === "building") {
      details.push(`Building cannot contain another building node: ${node.code}`);
    }

    seenIds.add(node.id);
    seenCodes.add(node.code);

    node.children?.forEach((child) => walk(child, node.type));
  }

  nodes.forEach((node) => walk(node));

  if (details.length > 0) {
    throw new ImportValidationError("Import validation failed.", details);
  }

  return nodes;
}

export function collectMergeConflicts(current: StrataTreeNode[], incoming: StrataTreeNode[]) {
  const currentCodes = new Set(flattenNodeCodes(current));
  return flattenNodeCodes(incoming).filter((code) => currentCodes.has(code));
}

export function countTopLevelNodes(nodes: StrataTreeNode[]) {
  return nodes.length;
}

export function countAllNodes(nodes: StrataTreeNode[]): number {
  return nodes.reduce((count, node) => count + 1 + countAllNodes(node.children ?? []), 0);
}

export function convertTreeToCsv(tree: StrataTreeNode[]) {
  const header = [
    "building_code",
    "building_name",
    "building_status",
    "building_documents",
    "area_code",
    "area_name",
    "area_status",
    "area_documents",
    "unit_code",
    "unit_name",
    "unit_status",
    "unit_documents"
  ];
  const rows: string[] = [header.join(",")];

  tree.forEach((building) => {
    const buildingDocuments = building.documentsExpected.join("|");
    const buildingChildren = building.children ?? [];

    buildingChildren.forEach((areaOrUnit) => {
      if (areaOrUnit.type === "unit") {
        rows.push(
          [
            building.code,
            building.name,
            building.status,
            buildingDocuments,
            "",
            "",
            "",
            "",
            areaOrUnit.code,
            areaOrUnit.name,
            areaOrUnit.status,
            areaOrUnit.documentsExpected.join("|")
          ]
            .map(escapeCsv)
            .join(",")
        );
        return;
      }

      const areaDocuments = areaOrUnit.documentsExpected.join("|");
      const units = areaOrUnit.children ?? [];

      if (!units.length) {
        rows.push(
          [
            building.code,
            building.name,
            building.status,
            buildingDocuments,
            areaOrUnit.code,
            areaOrUnit.name,
            areaOrUnit.status,
            areaDocuments,
            "",
            "",
            "",
            ""
          ]
            .map(escapeCsv)
            .join(",")
        );
      }

      units.forEach((unit) => {
        rows.push(
          [
            building.code,
            building.name,
            building.status,
            buildingDocuments,
            areaOrUnit.code,
            areaOrUnit.name,
            areaOrUnit.status,
            areaDocuments,
            unit.code,
            unit.name,
            unit.status,
            unit.documentsExpected.join("|")
          ]
            .map(escapeCsv)
            .join(",")
        );
      });
    });
  });

  return rows.join("\n");
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

function buildCountsLabel(type: StrataNodeType, children?: StrataTreeNode[]) {
  if (!children?.length) {
    return type === "unit" ? "1 unit record" : "0 child nodes";
  }

  const areaCount = children.filter((child) => child.type === "area").length;
  const unitCount = countUnits(children);

  if (type === "building") {
    return `${areaCount} areas • ${unitCount} units`;
  }

  if (type === "area") {
    return `${unitCount} units`;
  }

  return `${children.length} child nodes`;
}

function countUnits(nodes: StrataTreeNode[]): number {
  return nodes.reduce((count, node) => {
    if (node.type === "unit") {
      return count + 1;
    }

    return count + countUnits(node.children ?? []);
  }, 0);
}

function mergeTreeNode(current: StrataTreeNode, incoming: StrataTreeNode): StrataTreeNode {
  const mergedChildren = [...(current.children ?? []).map(cloneNode)];

  (incoming.children ?? []).forEach((nextChild) => {
    const existingIndex = mergedChildren.findIndex((item) => item.code === nextChild.code);

    if (existingIndex === -1) {
      mergedChildren.push(cloneNode(nextChild));
      return;
    }

    mergedChildren[existingIndex] = mergeTreeNode(mergedChildren[existingIndex], nextChild);
  });

  return {
    ...current,
    name: incoming.name,
    status: incoming.status,
    code: incoming.code,
    documentsExpected: Array.from(
      new Set([...current.documentsExpected, ...incoming.documentsExpected])
    ),
    children: mergedChildren
  };
}

function cloneNode(node: StrataTreeNode): StrataTreeNode {
  return {
    ...node,
    documentsExpected: [...node.documentsExpected],
    children: node.children?.map(cloneNode)
  };
}

function cleanCsvValue(value: string) {
  return value.trim().replace(/^"|"$/g, "");
}

function flattenNodeCodes(nodes: StrataTreeNode[]): string[] {
  return nodes.flatMap((node) => [node.code, ...flattenNodeCodes(node.children ?? [])]);
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}
