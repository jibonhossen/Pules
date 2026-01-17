import { PULSE_COLORS } from '@/lib/theme';
import type { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { View } from 'react-native';
import { Text } from './ui/text';

interface StatsCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
    subtitle?: string;
}

export function StatsCard({ icon: Icon, label, value, subtitle }: StatsCardProps) {
    const { colorScheme } = useColorScheme();
    const colors = PULSE_COLORS[colorScheme ?? 'dark'];

    return (
        <View className="flex-1 rounded-2xl bg-card p-4">
            <View className="mb-3 flex-row items-center gap-2">
                <View
                    className="rounded-xl p-2"
                    style={{ backgroundColor: `${colors.primary}20` }}
                >
                    <Icon size={18} color={colors.primary} strokeWidth={2} />
                </View>
                <Text className="text-sm text-muted-foreground">{label}</Text>
            </View>
            <Text className="text-3xl font-bold text-foreground">{value}</Text>
            {subtitle && (
                <Text className="mt-1 text-xs text-muted-foreground">{subtitle}</Text>
            )}
        </View>
    );
}
