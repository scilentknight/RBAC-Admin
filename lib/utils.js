export function slugify(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount || 0);
}

export function formatDate(dateString) {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Cartesian product utility for generating variant combinations from multiple attributes
 * @param {Array<Array<{ attributeId: string, attributeName: string, valueId: string, value: string }>>} arrays
 */
export function cartesianProduct(arrays) {
  return arrays.reduce(
    (acc, curr) => {
      const res = [];
      for (const a of acc) {
        for (const b of curr) {
          res.push([...a, b]);
        }
      }
      return res;
    },
    [[]]
  );
}

/**
 * Convert JSON array to CSV string
 */
export function convertToCSV(data, headers) {
  if (!data || !data.length) return "";
  const headerKeys = Object.keys(headers);
  const headerLabels = Object.values(headers);

  const rows = [headerLabels.join(",")];

  for (const item of data) {
    const row = headerKeys.map((key) => {
      let val = item[key] !== undefined && item[key] !== null ? item[key] : "";
      if (typeof val === "string") {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    rows.push(row.join(","));
  }

  return rows.join("\n");
}
