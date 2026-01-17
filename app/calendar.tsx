import { Text } from '@/components/ui/text';
import * as React from 'react';
import { View } from 'react-native';

export default function CalendarScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-background px-5">
            <Text className="text-2xl font-bold text-foreground">Calendar</Text>
            <Text className="mt-4 text-center text-muted-foreground">
                Calendar view coming soon...
            </Text>
        </View>
    );
}
