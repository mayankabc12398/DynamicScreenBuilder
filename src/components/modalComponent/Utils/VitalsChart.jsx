import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

const VitalsChart = ({ vitalsData }) => {
    const [t] = useTranslation();

    const chartData = useMemo(() => {
        if (!vitalsData || vitalsData.length === 0) return [];

        // Parse and sort data chronologically
        const processed = [...vitalsData].sort((a, b) => {
            const dateA = new Date(`${a.date || a.DATE || ""} ${a.time || a.TIME || ""}`);
            const dateB = new Date(`${b.date || b.DATE || ""} ${b.time || b.TIME || ""}`);
            return dateA - dateB;
        }).map(v => {
            const dateObj = new Date(v.date || v.DATE || "");
            const dateStr = !isNaN(dateObj) ? `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}` : "";
            const timeStr = (v.time || v.TIME || "").substring(0, 5); // Just HH:mm
            const datetime = `${dateStr} ${timeStr}`;

            const bpStr = v.bp || v.BP || "";
            let systolic = null;
            let diastolic = null;
            if (bpStr && bpStr.includes("/")) {
                const parts = bpStr.split("/");
                systolic = parseFloat(parts[0]);
                diastolic = parseFloat(parts[1]);
            }

            const parseVal = (keys) => {
                for (let k of keys) {
                    if (v[k] !== undefined && v[k] !== null && v[k] !== "") {
                        const val = parseFloat(v[k]);
                        return isNaN(val) ? null : val;
                    }
                }
                return null;
            };

            return {
                datetime,
                systolic,
                diastolic,
                pulse: parseVal(["pulse", "P"]),
                resp: parseVal(["resp", "R"]),
                temp: parseVal(["t", "T", "temp"]),
                spo2: parseVal(["spO2", "SPO2"]),
                wt: parseVal(["wt", "WT", "weight"]),
            };
        });

        return processed;
    }, [vitalsData]);

    if (chartData.length === 0) {
        return <div className="p-4 text-center text-muted">{t("No data available for graphing")}</div>;
    }

    return (
        <div className="vitals-chart-container w-100" style={{ padding: '10px 0', minHeight: '650px' }}>
            <div className="mb-4">
                <h6 className="text-center text-primary mb-3">{t("Cardiovascular (BP & Pulse)")}</h6>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="datetime" 
                                tick={{ fontSize: 12 }} 
                                angle={-45} 
                                textAnchor="end"
                            />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#333' }}
                            />
                            <Legend verticalAlign="top" height={36}/>
                            <Line type="monotone" dataKey="systolic" name={t("Systolic")} stroke="#dc3545" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            <Line type="monotone" dataKey="diastolic" name={t("Diastolic")} stroke="#007bff" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            <Line type="monotone" dataKey="pulse" name={t("Pulse")} stroke="#28a745" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="mt-5">
                <h6 className="text-center text-info mb-3">{t("Temperature, Resp & SpO2")}</h6>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                                dataKey="datetime" 
                                tick={{ fontSize: 12 }} 
                                angle={-45} 
                                textAnchor="end"
                            />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#333' }}
                            />
                            <Legend verticalAlign="top" height={36}/>
                            <Line type="monotone" dataKey="temp" name={t("Temp (F)")} stroke="#fd7e14" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            <Line type="monotone" dataKey="resp" name={t("Resp")} stroke="#6f42c1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                            <Line type="monotone" dataKey="spo2" name={t("SpO2 %")} stroke="#17a2b8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default VitalsChart;
