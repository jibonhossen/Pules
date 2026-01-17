import { PULSE_COLORS } from '@/lib/theme';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';

interface HeatmapProps {
    data: Map<string, number>;
    weeks?: number;
}

function getColorForHours(hours: number, colors: typeof PULSE_COLORS.dark): string {
    if (hours === 0) return colors.muted;
    if (hours < 1) return '#581c87';  // Fuchsia-950
    if (hours < 2) return '#701a75';  // Fuchsia-900
    if (hours < 4) return '#a21caf';  // Fuchsia-700
    return colors.primary;           // Fuchsia-500
}

function formatDateLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short' });
}

export function Heatmap({ data, weeks = 12 }: HeatmapProps) {
    const { colorScheme } = useColorScheme();
    const colors = PULSE_COLORS[colorScheme ?? 'dark'];

    const CELL_SIZE = 14;
    const CELL_GAP = 3;
    const DAYS_IN_WEEK = 7;

    // Generate dates for the grid (past N weeks)
    const generateDates = (): Date[][] => {
        const result: Date[][] = [];
        const today = new Date();
        const dayOfWeek = today.getDay();

        // Start from the beginning of the current week
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek - (weeks - 1) * 7);

        for (let week = 0; week < weeks; week++) {
            const weekDates: Date[] = [];
            for (let day = 0; day < DAYS_IN_WEEK; day++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + week * 7 + day);
                weekDates.push(date);
            }
            result.push(weekDates);
        }

        return result;
    };

    const dates = generateDates();
    const today = new Date().toISOString().split('T')[0];

    // Get month labels
    const monthLabels: { month: string; position: number }[] = [];
    let lastMonth = -1;
    dates.forEach((week, weekIndex) => {
        const firstDayOfWeek = week[0];
        if (firstDayOfWeek.getMonth() !== lastMonth) {
            lastMonth = firstDayOfWeek.getMonth();
            monthLabels.push({
                month: formatDateLabel(firstDayOfWeek),
                position: weekIndex,
            });
        }
    });

    const weekDayLabels = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

    return (
        <View className="rounded-2xl bg-card p-4">
            <Text className="mb-4 text-lg font-semibold text-foreground">
                Activity Heatmap
            </Text>

            {/* Month labels */}
            <View className="mb-2 flex-row" style={{ paddingLeft: 28 }}>
                {monthLabels.map((label, index) => (
                    <Text
                        key={index}
                        className="text-xs text-muted-foreground"
                        style={{
                            position: 'absolute',
                            left: 28 + label.position * (CELL_SIZE + CELL_GAP),
                        }}
                    >
                        {label.month}
                    </Text>
                ))}
            </View>

            <View className="mt-4 flex-row">
                {/* Day labels */}
                <View className="mr-2" style={{ width: 20 }}>
                    {weekDayLabels.map((day, index) => (
                        <View
                            key={index}
                            style={{ height: CELL_SIZE + CELL_GAP }}
                            className="justify-center"
                        >
                            <Text className="text-xs text-muted-foreground">{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Heatmap grid */}
                <View className="flex-row">
                    {dates.map((week, weekIndex) => (
                        <View key={weekIndex} style={{ marginRight: CELL_GAP }}>
                            {week.map((date, dayIndex) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const seconds = data.get(dateStr) || 0;
                                const hours = seconds / 3600;
                                const isFuture = dateStr > today;

                                return (
                                    <View
                                        key={dayIndex}
                                        style={{
                                            width: CELL_SIZE,
                                            height: CELL_SIZE,
                                            marginBottom: CELL_GAP,
                                            backgroundColor: isFuture
                                                ? 'transparent'
                                                : getColorForHours(hours, colors),
                                            borderRadius: 3,
                                            opacity: isFuture ? 0.2 : 1,
                                            borderWidth: isFuture ? 1 : 0,
                                            borderColor: colors.muted,
                                        }}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </View>
            </View>

            {/* Legend */}
            <View className="mt-4 flex-row items-center justify-end gap-1">
                <Text className="mr-2 text-xs text-muted-foreground">Less</Text>
                {[0, 0.5, 1.5, 3, 5].map((hours, index) => (
                    <View
                        key={index}
                        style={{
                            width: 12,
                            height: 12,
                            backgroundColor: getColorForHours(hours, colors),
                            borderRadius: 2,
                        }}
                    />
                ))}
                <Text className="ml-2 text-xs text-muted-foreground">More</Text>
            </View>
        </View>
    );
}
