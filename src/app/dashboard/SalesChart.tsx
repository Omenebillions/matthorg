
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesData {
    name: string;
    sales: number;
}

interface SalesChartProps {
    data: SalesData[];
}

export default function SalesChart({ data }: SalesChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#3B82F6" name="Sales" />
            </BarChart>
        </ResponsiveContainer>
    );
}

