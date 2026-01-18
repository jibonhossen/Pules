import { DailyReport } from '@/components/DailyReport';
import { Heatmap } from '@/components/Heatmap';
import { StatsCard } from '@/components/StatsCard';
import { Text } from '@/components/ui/text';
import { getDailyStats } from '@/lib/database';
import { useSessionStore } from '@/store/sessions';
import { Clock, Flame } from 'lucide-react-native';
import * as React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';

function formatFocusTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

export default function ReportsScreen() {
    const { totalFocusTime, currentStreak, loadStats } = useSessionStore();
    const [dailyData, setDailyData] = React.useState<Map<string, number>>(new Map());
    const [refreshing, setRefreshing] = React.useState(false);

    const loadData = React.useCallback(async () => {
        await loadStats();
        const stats = await getDailyStats(90); // 90 days for heatmap
        setDailyData(stats);
    }, [loadStats]);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Header */}
            <View className="px-5 py-4">
                <Text className="text-2xl font-bold text-foreground">Reports</Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                    Track your productivity over time
                </Text>
            </View>

            {/* Stats Cards */}
            <View className="gap-3 px-5">
                {/* Today's Focus - Full Width */}
                <StatsCard
                    icon={Clock}
                    label="Today's Focus"
                    value={formatFocusTime(dailyData.get(new Date().toISOString().split('T')[0]) || 0)}
                    subtitle="Keep it up!"
                />
                {/* Total and Streak - Row */}
                <View className="flex-row gap-3">
                    <StatsCard
                        icon={Clock}
                        label="Total Focus"
                        value={formatFocusTime(totalFocusTime)}
                        subtitle="All time"
                    />
                    <StatsCard
                        icon={Flame}
                        label="Streak"
                        value={`${currentStreak}`}
                        subtitle={currentStreak === 1 ? 'day' : 'days'}
                    />
                </View>
            </View>

            {/* Daily Report (Weekly Bar Chart) */}
            <View className="mt-6 px-5">
                <DailyReport data={dailyData} />
            </View>

            {/* Heatmap */}
            <View className="mt-6 px-5">
                <Heatmap data={dailyData} weeks={12} />
            </View>
        </ScrollView>
    );
}
