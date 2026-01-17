import { Text } from '@/components/ui/text';
import { PULSE_COLORS } from '@/lib/theme';
import { usePathname, useRouter } from 'expo-router';
import { BarChart3, Calendar, Clock } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const TABS = [
    { name: 'index', label: 'Timer', icon: Clock, href: '/' },
    { name: 'calendar', label: 'Calendar', icon: Calendar, href: '/calendar' },
    { name: 'reports', label: 'Reports', icon: BarChart3, href: '/reports' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabItemProps {
    tab: (typeof TABS)[number];
    isActive: boolean;
    onPress: () => void;
    colors: typeof PULSE_COLORS.dark;
}

function TabItem({ tab, isActive, onPress, colors }: TabItemProps) {
    const scale = useSharedValue(1);
    const Icon = tab.icon;

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.95, { duration: 100 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={animatedStyle}
            className="flex-1 items-center justify-center py-2"
        >
            <View
                className={`items-center justify-center px-5 py-2 ${isActive ? 'rounded-2xl bg-primary/15' : ''
                    }`}
            >
                <Icon
                    size={22}
                    color={isActive ? colors.primary : colors.mutedForeground}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                <Text
                    className={`mt-1 text-xs font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'
                        }`}
                >
                    {tab.label}
                </Text>
            </View>
        </AnimatedPressable>
    );
}

export function CustomTabBar() {
    const pathname = usePathname();
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const colors = PULSE_COLORS[colorScheme ?? 'dark'];

    const getActiveTab = () => {
        if (pathname === '/' || pathname === '/index') return 'index';
        if (pathname.includes('/calendar')) return 'calendar';
        if (pathname.includes('/reports')) return 'reports';
        return 'index';
    };

    const activeTab = getActiveTab();

    return (
        <View
            style={{
                backgroundColor: colors.card,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            }}
            className="flex-row pt-2"
        >
            {TABS.map((tab) => (
                <TabItem
                    key={tab.name}
                    tab={tab}
                    isActive={activeTab === tab.name}
                    onPress={() => router.push(tab.href as any)}
                    colors={colors}
                />
            ))}
        </View>
    );
}
