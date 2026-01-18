import { Text } from '@/components/ui/text';
import { PULSE_COLORS } from '@/lib/theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Pressable, View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface DailyBarProps {
    day: string;
    hours: number;
    maxHours: number;
    isToday: boolean;
    isCurrentWeek: boolean;
}

function DailyBar({ day, hours, maxHours, isToday, isCurrentWeek }: DailyBarProps) {
    const { colorScheme } = useColorScheme();
    const colors = PULSE_COLORS[colorScheme ?? 'dark'];

    const height = maxHours > 0 ? Math.max((hours / maxHours) * 100, hours > 0 ? 8 : 0) : 0;

    return (
        <View className="flex-1 items-center">
            <View
                className="w-full justify-end overflow-hidden rounded-t-lg"
                style={{ height: 120 }}
            >
                <View
                    style={{
                        height: `${height}%`,
                        backgroundColor: isToday && isCurrentWeek ? colors.primary : colors.secondary,
                        borderRadius: 6,
                        minHeight: hours > 0 ? 4 : 0,
                    }}
                />
            </View>
            <Text
                className={`mt-2 text-xs ${isToday && isCurrentWeek ? 'font-bold text-primary' : 'text-muted-foreground'
                    }`}
            >
                {day}
            </Text>
            <Text className="text-xs text-muted-foreground">
                {hours >= 1 ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m` : hours > 0 ? `${Math.round(hours * 60)}m` : '-'}
            </Text>
        </View>
    );
}

interface DailyReportProps {
    data: Map<string, number>;
}

export function DailyReport({ data }: DailyReportProps) {
    const { colorScheme } = useColorScheme();
    const colors = PULSE_COLORS[colorScheme ?? 'dark'];

    const [weekOffset, setWeekOffset] = React.useState(0);
    const translateX = useSharedValue(0);
    const animatedOpacity = useSharedValue(1);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate week start based on offset
    const getWeekDays = (offset: number) => {
        const days: { date: Date; dateStr: string; dayLabel: string }[] = [];
        const referenceDate = new Date(today);
        referenceDate.setDate(today.getDate() - (offset * 7));

        for (let i = 6; i >= 0; i--) {
            const date = new Date(referenceDate);
            date.setDate(referenceDate.getDate() - i);
            days.push({
                date,
                dateStr: date.toISOString().split('T')[0],
                dayLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
            });
        }
        return days;
    };

    const days = getWeekDays(weekOffset);

    // Get week date range for display
    const weekStart = days[0].date;
    const weekEnd = days[6].date;
    const weekLabel = weekOffset === 0
        ? 'This Week'
        : weekOffset === 1
            ? 'Last Week'
            : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    // Calculate hours for each day
    const dailyHours = days.map((d) => {
        const seconds = data.get(d.dateStr) || 0;
        return seconds / 3600;
    });

    const maxHours = Math.max(...dailyHours, 1);
    const totalSeconds = dailyHours.reduce((sum, h) => sum + h * 3600, 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.round((totalSeconds % 3600) / 60);
    const avgSeconds = totalSeconds / 7;
    const avgHours = Math.floor(avgSeconds / 3600);
    const avgMinutes = Math.round((avgSeconds % 3600) / 60);

    const animateTransition = (direction: 'left' | 'right', callback: () => void) => {
        const exitX = direction === 'left' ? -50 : 50;
        const enterX = direction === 'left' ? 50 : -50;

        animatedOpacity.value = withTiming(0, { duration: 150 });
        translateX.value = withTiming(exitX, { duration: 150 }, () => {
            runOnJS(callback)();
            translateX.value = enterX;
            translateX.value = withTiming(0, { duration: 200 });
            animatedOpacity.value = withTiming(1, { duration: 150 });
        });
    };

    const goToPreviousWeek = () => {
        animateTransition('right', () => setWeekOffset((prev) => prev + 1));
    };

    const goToNextWeek = () => {
        if (weekOffset > 0) {
            animateTransition('left', () => setWeekOffset((prev) => prev - 1));
        }
    };

    const panGesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onUpdate((event) => {
            translateX.value = event.translationX * 0.5;
        })
        .onEnd((event) => {
            if (event.translationX > SWIPE_THRESHOLD || event.velocityX > 500) {
                // Swipe right -> go to previous week
                runOnJS(goToPreviousWeek)();
            } else if ((event.translationX < -SWIPE_THRESHOLD || event.velocityX < -500) && weekOffset > 0) {
                // Swipe left -> go to next week (only if not current week)
                runOnJS(goToNextWeek)();
            } else {
                translateX.value = withTiming(0, { duration: 200 });
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
        opacity: animatedOpacity.value,
    }));

    return (
        <View className="rounded-2xl bg-card p-4">
            {/* Header with Navigation */}
            <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                    <Pressable
                        onPress={goToPreviousWeek}
                        className="rounded-full p-1"
                        style={{ backgroundColor: colors.muted }}
                    >
                        <ChevronLeft size={20} color={colors.foreground} />
                    </Pressable>
                    <Text className="min-w-[100px] text-center text-base font-semibold text-foreground">
                        {weekLabel}
                    </Text>
                    <Pressable
                        onPress={goToNextWeek}
                        disabled={weekOffset === 0}
                        className="rounded-full p-1"
                        style={{
                            backgroundColor: colors.muted,
                            opacity: weekOffset === 0 ? 0.3 : 1,
                        }}
                    >
                        <ChevronRight size={20} color={colors.foreground} />
                    </Pressable>
                </View>
                <View className="flex-row items-center gap-4">
                    <View className="items-end">
                        <Text className="text-xs text-muted-foreground">Total</Text>
                        <Text className="font-semibold text-foreground">
                            {totalHours > 0 ? `${totalHours}h ` : ''}{totalMinutes}m
                        </Text>
                    </View>
                    <View className="items-end">
                        <Text className="text-xs text-muted-foreground">Daily Avg</Text>
                        <Text className="font-semibold text-primary">
                            {avgHours > 0 ? `${avgHours}h ` : ''}{avgMinutes}m
                        </Text>
                    </View>
                </View>
            </View>

            {/* Swipeable Bar Chart */}
            <GestureDetector gesture={panGesture}>
                <Animated.View style={animatedStyle} className="flex-row gap-2">
                    {days.map((d, index) => (
                        <DailyBar
                            key={d.dateStr}
                            day={d.dayLabel}
                            hours={dailyHours[index]}
                            maxHours={maxHours}
                            isToday={d.dateStr === todayStr}
                            isCurrentWeek={weekOffset === 0}
                        />
                    ))}
                </Animated.View>
            </GestureDetector>

                    
        </View>
    );
}
