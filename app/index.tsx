import { CircularTimer } from '@/components/CircularTimer';
import { SessionList } from '@/components/SessionList';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PULSE_COLORS } from '@/lib/theme';
import { useSessionStore } from '@/store/sessions';
import { MoonStarIcon, Play, Square, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ViewMode = 'list' | 'focus';

function SegmentedControl({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  const { colorScheme } = useColorScheme();
  const colors = PULSE_COLORS[colorScheme ?? 'dark'];

  return (
    <View
      className="flex-row rounded-xl p-1"
      style={{ backgroundColor: colors.muted }}
    >
      {(['list', 'focus'] as const).map((mode) => (
        <Pressable
          key={mode}
          onPress={() => onChange(mode)}
          className={`flex-1 items-center rounded-lg px-4 py-2 ${value === mode ? 'bg-card' : ''
            }`}
          style={value === mode ? {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          } : {}}
        >
          <Text
            className={`text-sm font-medium capitalize ${value === mode ? 'text-foreground' : 'text-muted-foreground'
              }`}
          >
            {mode}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const colors = PULSE_COLORS[colorScheme ?? 'dark'];

  return (
    <Pressable
      onPress={toggleColorScheme}
      className="rounded-full p-2"
      style={{ backgroundColor: colors.muted }}
    >
      <Icon
        as={colorScheme === 'dark' ? MoonStarIcon : SunIcon}
        className="size-5 text-foreground"
      />
    </Pressable>
  );
}

function PlayButton({
  isRunning,
  onPress,
}: {
  isRunning: boolean;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const colors = PULSE_COLORS[colorScheme ?? 'dark'];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: isRunning ? colors.destructive : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: isRunning ? colors.destructive : colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        },
      ]}
    >
      {isRunning ? (
        <Square size={22} color="#fff" fill="#fff" />
      ) : (
        <Play size={24} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
      )}
    </AnimatedPressable>
  );
}



export default function TimerScreen() {
  const { colorScheme } = useColorScheme();
  const colors = PULSE_COLORS[colorScheme ?? 'dark'];

  const [viewMode, setViewMode] = React.useState<ViewMode>('focus');
  const [topic, setTopic] = React.useState('');

  const {
    isRunning,
    elapsedSeconds,
    startTimer,
    stopTimer,
    tick,
    loadSessions,
    loadStats,
  } = useSessionStore();

  // Timer tick effect
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRunning) {
      interval = setInterval(tick, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, tick]);

  // Load data on mount
  React.useEffect(() => {
    loadSessions();
    loadStats();
  }, []);

  const handlePlayPress = async () => {
    if (isRunning) {
      await stopTimer();
      setTopic('');
    } else if (topic.trim()) {
      await startTimer(topic.trim());
      Keyboard.dismiss();
    }
  };

  const handleContinueSession = async (sessionTopic: string) => {
    setTopic(sessionTopic);
    await startTimer(sessionTopic);
    setViewMode('focus');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="text-2xl font-bold text-foreground">Pulse</Text>
          <ThemeToggle />
        </View>

        {/* Segmented Control */}
        <View className="px-5 pb-4">
          <SegmentedControl value={viewMode} onChange={setViewMode} />
        </View>

        {/* Content */}
        <View className="flex-1">
          {viewMode === 'focus' ? (
            <View className="flex-1 items-center justify-center">
              <CircularTimer
                elapsedSeconds={elapsedSeconds}
                isRunning={isRunning}
              />
            </View>
          ) : (
            <SessionList onStartSession={handleContinueSession} />
          )}
        </View>

        {/* Input Section */}
        <View
          className="border-t px-5 pb-4 pt-4"
          style={{ borderTopColor: colors.border }}
        >
          <View className="flex-row items-center gap-3">
            <View
              className="flex-1 flex-row items-center rounded-2xl px-4"
              style={{ backgroundColor: colors.card, height: 52 }}
            >
              <TextInput
                placeholder="I'm working on..."
                placeholderTextColor={colors.mutedForeground}
                value={topic}
                onChangeText={setTopic}
                editable={!isRunning}
                className="flex-1 text-base"
                style={{ color: colors.foreground }}
              />
            </View>
            <PlayButton
              isRunning={isRunning}
              onPress={handlePlayPress}
            />
          </View>
          {isRunning && (
            <Text className="mt-3 text-center text-sm text-muted-foreground">
              Focusing on: <Text className="text-primary">{topic}</Text>
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
