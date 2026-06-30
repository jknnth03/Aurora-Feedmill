import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend as ChartJSLegend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useGetBirdsQuery } from "../../features/api/birds/birdsApi";
import { useGetPestResponsesQuery } from "../../features/api/pests/pestApi";
import { useGetCobsQuery } from "../../features/api/cobs/cobsApi";
import "./Dashboard.scss";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  ChartJSLegend,
);

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TOTAL_PERIODS = 4;

const INFESTATION_COLOR = (level = "") => {
  const l = level.toLowerCase();
  if (l === "critical") return "#e53935";
  if (l === "moderate") return "#FFA726";
  return "#66BB6A";
};

const INFESTATION_RANK = (level = "") => {
  const l = level.toLowerCase();
  if (l === "critical") return 2;
  if (l === "moderate") return 1;
  return 0;
};

const COBS_SCORE_COLOR = (score) => {
  if (score >= 90) return "#66BB6A";
  if (score >= 75) return "#FFA726";
  return "#e53935";
};

const flattenBirdsForChart = (rawData = {}) => {
  const records = [];
  Object.entries(rawData).forEach(([, checklist]) => {
    const periodMap = checklist?.periods ?? {};
    Object.entries(periodMap).forEach(([periodKey, entries]) => {
      const periodNum = parseInt(periodKey.replace("Period ", ""), 10);
      (entries ?? []).forEach((entry) => {
        records.push({
          periodNum,
          batchNo: entry.batch_no,
          status: entry.status ?? "Pending",
          responses: entry.responses ?? [],
        });
      });
    });
  });
  return records;
};

const flattenCobsForChart = (rawData = {}) => {
  const unitScores = {};
  Object.entries(rawData).forEach(([unitKey, unitData]) => {
    const unitName = unitData?.unit ?? unitKey.replace("Unit: ", "");
    const weeks = unitData?.weeks ?? {};
    const weekEntries = [];
    Object.entries(weeks).forEach(([weekLabel, entries]) => {
      if (!Array.isArray(entries) || entries.length === 0) return;
      const latest = entries.reduce((a, b) =>
        b.batch_no > a.batch_no ? b : a,
      );
      if (latest?.score != null) {
        weekEntries.push({
          week: weekLabel,
          score: latest.score,
          status: latest.status ?? "Pending",
        });
      }
    });
    unitScores[unitName] = weekEntries;
  });
  return unitScores;
};

const flattenPestData = (rawData = {}) => {
  const pestMap = {};
  Object.values(rawData).forEach((checklist) => {
    const periods = checklist?.periods ?? {};
    Object.values(periods).forEach((entries) => {
      (entries ?? []).forEach((entry) => {
        (entry.responses ?? []).forEach((resp) => {
          const area = resp.response?.inspection_area ?? "Unknown";
          const pests = resp.response?.pests ?? [];
          pests.forEach(({ name, score }) => {
            if (!pestMap[name]) pestMap[name] = {};
            const prev = pestMap[name][area] ?? 0;
            pestMap[name][area] = Math.max(prev, score ?? 0);
          });
        });
      });
    });
  });
  return pestMap;
};

const baseTooltip = {
  backgroundColor: "rgba(30,20,10,0.82)",
  titleColor: "#fff",
  bodyColor: "#e0d5c8",
  borderColor: "rgba(243,121,37,0.35)",
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
};

const ChartLegend = ({ items }) => (
  <div className="qad-legend">
    {items.map(({ color, label }) => (
      <span key={label} className="qad-legend__item">
        <span className="qad-legend__dot" style={{ background: color }} />
        {label}
      </span>
    ))}
  </div>
);

const ChartCard = ({ title, sub, children, className = "" }) => (
  <div className={`qad-chart-card ${className}`}>
    <p className="qad-chart-card__title">{title}</p>
    {sub && <p className="qad-chart-card__sub">{sub}</p>}
    {children}
  </div>
);

const LoadingSkeleton = () => (
  <div className="qad-skeleton-wrap">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="qad-skeleton-card" />
    ))}
  </div>
);

const PEST_SCORE_COLOR = (score) => {
  if (score >= 7) return "#e53935";
  if (score >= 3) return "#FFA726";
  return "#66BB6A";
};

const PEST_SCORE_RANK = (score) => {
  if (score >= 7) return 2;
  if (score >= 3) return 1;
  return 0;
};

const BirdsView = ({ data }) => {
  const records = useMemo(() => flattenBirdsForChart(data ?? {}), [data]);

  const areaInfestationMap = {};
  records.forEach((r) => {
    const area = r.responses[0]?.response?.inspection_area ?? "Unknown";
    const level = r.responses[0]?.response?.infestation_level ?? "Low";
    const prev = areaInfestationMap[area];
    if (!prev || INFESTATION_RANK(level) > INFESTATION_RANK(prev.level)) {
      areaInfestationMap[area] = { level, count: (prev?.count ?? 0) + 1 };
    } else {
      areaInfestationMap[area] = { ...prev, count: prev.count + 1 };
    }
  });

  const areaLabels = Object.keys(areaInfestationMap);
  const areaBarData = {
    labels: areaLabels.length ? areaLabels : ["—"],
    datasets: [
      {
        label: "Infestation Level",
        data: areaLabels.length
          ? areaLabels.map((k) => areaInfestationMap[k].count)
          : [0],
        backgroundColor: areaLabels.length
          ? areaLabels.map((k) =>
              INFESTATION_COLOR(areaInfestationMap[k].level),
            )
          : ["#66BB6A"],
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="qad-view">
      <ChartCard
        title="Birds Monitoring — Inspection Areas by Infestation Level"
        className="qad-chart-card--full">
        <ChartLegend
          items={[
            { color: "#e53935", label: "Critical (7 or more)" },
            { color: "#66BB6A", label: "Low (0–1)" },
            { color: "#FFA726", label: "Moderate (3–7)" },
          ]}
        />
        <div className="qad-chart-wrap qad-chart-wrap--tall">
          <Bar
            data={areaBarData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  ...baseTooltip,
                  callbacks: {
                    label: (ctx) => {
                      const level =
                        areaInfestationMap[ctx.label]?.level ?? "Low";
                      return ` ${level} infestation`;
                    },
                  },
                },
              },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: {
                    color: "#888",
                    maxRotation: 45,
                    minRotation: 45,
                    font: { size: 11 },
                  },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: "rgba(150,130,100,0.12)" },
                  ticks: { color: "#888", stepSize: 1 },
                },
              },
            }}
          />
        </div>
      </ChartCard>
    </div>
  );
};

const PestChart = ({ pestName, areaScores }) => {
  const areas = Object.keys(areaScores);
  const scores = areas.map((a) => areaScores[a]);
  const barData = {
    labels: areas,
    datasets: [
      {
        label: pestName,
        data: scores,
        backgroundColor: scores.map((s) => PEST_SCORE_COLOR(s)),
        borderRadius: 4,
      },
    ],
  };
  return (
    <ChartCard title={pestName} className="qad-chart-card--full">
      <ChartLegend
        items={[
          { color: "#e53935", label: "Critical (7+)" },
          { color: "#66BB6A", label: "Low (0–2)" },
          { color: "#FFA726", label: "Moderate (3–6)" },
        ]}
      />
      <div className="qad-chart-wrap qad-chart-wrap--tall">
        <Bar
          data={barData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                ...baseTooltip,
                callbacks: {
                  label: (ctx) =>
                    ` Score: ${ctx.parsed.y} — ${PEST_SCORE_RANK(ctx.parsed.y) === 2 ? "Critical" : PEST_SCORE_RANK(ctx.parsed.y) === 1 ? "Moderate" : "Low"}`,
                },
              },
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  color: "#888",
                  maxRotation: 45,
                  minRotation: 45,
                  font: { size: 11 },
                },
              },
              y: {
                beginAtZero: true,
                grid: { color: "rgba(150,130,100,0.12)" },
                ticks: { color: "#888", stepSize: 1 },
              },
            },
          }}
        />
      </div>
    </ChartCard>
  );
};

const PestsView = ({ data, isLoading }) => {
  const pestMap = useMemo(() => flattenPestData(data ?? {}), [data]);
  const pestNames = Object.keys(pestMap);
  if (isLoading) return <LoadingSkeleton />;
  if (pestNames.length === 0) {
    return (
      <div className="qad-blank">
        <div className="qad-blank__icon">🐛</div>
        <p className="qad-blank__title">No pest data this month</p>
        <p className="qad-blank__sub">No responses recorded yet.</p>
      </div>
    );
  }
  return (
    <div className="qad-view">
      {pestNames.map((pestName) => (
        <PestChart
          key={pestName}
          pestName={pestName}
          areaScores={pestMap[pestName]}
        />
      ))}
    </div>
  );
};

const DOWNTIME_CHART = {
  riskAreas: {
    low: {
      label: "LOW RISK AREA",
      color: "#4caf50",
      textColor: "#fff",
      places: ["Pantry", "Office", "Conference Room"],
    },
    moderate: {
      label: "MODERATE RISK AREA",
      color: "#ff9800",
      textColor: "#fff",
      places: [
        "FM Laboratory",
        "Fabrication Area",
        "Bulk Loading Driveway",
        "Boiler Area",
        "Unloading Area",
        "Parking Space Near Silo",
      ],
    },
    high: {
      label: "HIGH RISK AREA",
      color: "#f44336",
      textColor: "#fff",
      places: ["Silo Dumping Area", "Pharmacy & Basemix", "Production & Flat"],
    },
  },
  rows: [
    {
      group: "RDF EMPLOYEE",
      subRows: [
        "Biolab",
        "Depot Office",
        "RDF Swine & Poultry",
        "Depot Production",
        "Palengke/Meatshop\nOther Farms\nOther Feedmills",
      ],
    },
    { group: "Minimum Requirements for Non-RDF Visitors", subRows: null },
    { group: "Non-RDF", subRows: ["Visitors"] },
  ],
  values: {
    Biolab: { low: 12, moderate: 24, high: 48 },
    "Depot Office": { low: 12, moderate: 24, high: 48 },
    "RDF Swine & Poultry": { low: 12, moderate: 24, high: 48 },
    "Depot Production": { low: 24, moderate: 24, high: 48 },
    "Palengke/Meatshop\nOther Farms\nOther Feedmills": {
      low: 24,
      moderate: 24,
      high: 48,
    },
    "Minimum Requirements for Non-RDF Visitors": {
      low: "Downtime",
      moderate: "Downtime\nChange of Clothes\n(PPE)",
      high: "Shower\nChange of Clothes\n(PPE)",
    },
    Visitors: { low: 24, moderate: 24, high: 48 },
  },
};

const DowntimeChart = () => (
  <div className="qad-downtime">
    <table className="qad-downtime__table">
      <thead>
        <tr>
          <th className="qad-downtime__th qad-downtime__th--left" colSpan={2}>
            <div className="qad-downtime__header-title">DOWNTIME CHART</div>
          </th>
          <th className="qad-downtime__th" colSpan={3}>
            <div className="qad-downtime__effective">
              Effective Date: August 1, 2024
            </div>
          </th>
        </tr>
        <tr>
          <th className="qad-downtime__th" colSpan={2} />
          <th className="qad-downtime__th" colSpan={3}>
            FEED MILL AREAS
          </th>
        </tr>
        <tr>
          <th className="qad-downtime__th qad-downtime__th--label" colSpan={2}>
            Last Place Visited
          </th>
          {Object.values(DOWNTIME_CHART.riskAreas).map((area) => (
            <th
              key={area.label}
              className="qad-downtime__th qad-downtime__th--area"
              style={{ background: area.color, color: area.textColor }}>
              <div className="qad-downtime__area-label">{area.label}</div>
              <div className="qad-downtime__area-places">
                {area.places.map((p) => (
                  <div key={p}>{p}</div>
                ))}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {DOWNTIME_CHART.rows.map((row) => {
          if (row.subRows) {
            return row.subRows.map((sub, i) => (
              <tr key={sub} className="qad-downtime__tr">
                {i === 0 && (
                  <td
                    className="qad-downtime__td qad-downtime__td--group"
                    rowSpan={row.subRows.length}>
                    {row.group}
                  </td>
                )}
                <td className="qad-downtime__td qad-downtime__td--sub">
                  {sub.split("\n").map((line, j) => (
                    <div key={j}>{line}</div>
                  ))}
                </td>
                {["low", "moderate", "high"].map((risk) => (
                  <td
                    key={risk}
                    className="qad-downtime__td qad-downtime__td--val">
                    {DOWNTIME_CHART.values[sub]?.[risk] ?? "—"}
                  </td>
                ))}
              </tr>
            ));
          }
          return (
            <tr key={row.group} className="qad-downtime__tr">
              <td
                className="qad-downtime__td qad-downtime__td--group"
                colSpan={2}>
                {row.group}
              </td>
              {["low", "moderate", "high"].map((risk) => (
                <td
                  key={risk}
                  className="qad-downtime__td qad-downtime__td--val">
                  {String(DOWNTIME_CHART.values[row.group]?.[risk] ?? "—")
                    .split("\n")
                    .map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const CobsScoreTable = ({ data }) => {
  const unitScores = useMemo(() => flattenCobsForChart(data ?? {}), [data]);
  const unitNames = Object.keys(unitScores);
  if (unitNames.length === 0) return null;

  const allWeeks = ["Week 1", "Week 2", "Week 3", "Week 4"];

  return (
    <div className="qad-cobs-scores">
      <p className="qad-cobs-scores__title">Cleanliness Score Summary</p>
      <div className="qad-cobs-scores__table-wrap">
        <table className="qad-cobs-scores__table">
          <thead>
            <tr>
              <th>Unit</th>
              {allWeeks.map((w) => (
                <th key={w}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {unitNames.map((unitName) => {
              const weekMap = {};
              (unitScores[unitName] ?? []).forEach((e) => {
                weekMap[e.week] = e;
              });
              return (
                <tr key={unitName}>
                  <td className="qad-cobs-scores__unit">{unitName}</td>
                  {allWeeks.map((w) => {
                    const entry = weekMap[w];
                    return (
                      <td key={w} className="qad-cobs-scores__score">
                        {entry ? (
                          <span
                            className="qad-cobs-scores__badge"
                            style={{
                              background: COBS_SCORE_COLOR(entry.score),
                            }}>
                            {entry.score}%
                          </span>
                        ) : (
                          <span className="qad-cobs-scores__dash">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CobsView = ({ data, isLoading }) => {
  if (isLoading) return <LoadingSkeleton />;
  return (
    <div className="qad-view">
      <DowntimeChart />
      <CobsScoreTable data={data} />
    </div>
  );
};

const TABS = [
  { key: "cobs", label: "COBS" },
  { key: "birds", label: "Birds" },
  { key: "pests", label: "Pests" },
];

const Dashboard = () => {
  const now = new Date();
  const [activeTab, setActiveTab] = useState("cobs");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const monthStr = String(month).padStart(2, "0");

  const { data: birdsData, isLoading: birdsLoading } = useGetBirdsQuery({
    month: monthStr,
    year: String(year),
    section: "birds",
  });

  const { data: pestData, isLoading: pestLoading } = useGetPestResponsesQuery({
    month: monthStr,
    year: String(year),
    section: "pests",
  });

  const { data: cobsData, isLoading: cobsLoading } = useGetCobsQuery({
    month: monthStr,
    year: String(year),
  });

  const resolvedPestData = pestData?.data ?? pestData ?? {};
  const resolvedCobsData = cobsData?.data ?? cobsData ?? {};
  const resolvedBirdsData = birdsData?.data ?? birdsData ?? {};

  const renderView = () => {
    if (activeTab === "cobs")
      return <CobsView data={resolvedCobsData} isLoading={cobsLoading} />;
    if (activeTab === "pests")
      return <PestsView data={resolvedPestData} isLoading={pestLoading} />;
    if (birdsLoading) return <LoadingSkeleton />;
    return <BirdsView data={resolvedBirdsData} />;
  };

  return (
    <div className="qad">
      <div className="qad__header">
        <div className="qad__header-left">
          <div>
            <h1 className="qad__title">Aurora Store — QA Dashboard</h1>
            <p className="qad__subtitle">
              QA Checklist monitoring · {MONTHS[month - 1]} {year}
            </p>
          </div>
        </div>
        <div className="qad__filters">
          <select
            className="qad__filter-select"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="qad__filter-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="qad__tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`qad__tab${activeTab === t.key ? " qad__tab--active" : ""}`}
            onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="qad__body">{renderView()}</div>
    </div>
  );
};

export default Dashboard;
