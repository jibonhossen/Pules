import { Text } from '@/components/ui/text';
import {
    deleteSession,
    getSessionsByTopic,
    renameAllSessionsWithTopic,
    type Session,
} from '@/lib/database';
import { PULSE_COLORS } from '@/lib/theme';
import { useSessionStore } from '@/store/sessions';
import { Edit3, Play, Trash2, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
    View,
    Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTION_WIDTH = 140; // Wider for two buttons

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function formatDate(isoString: string): string {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
}

interface SwipeableSessionCardProps {
    session: Session;
    onContinue: (topic: string) => void;
    onTap: (session: Session) => void;
    onDelete: (session: Session) => void;
}

const CONTINUE_WIDTH = 70;
const DELETE_WIDTH = 70;

function SwipeableSessionCard({
    session,
    onContinue,
    onTap,
    onDelete,
}: SwipeableSessionCardProps) {
    const { colorScheme } = useColorScheme();
    const colors = PULSE_COLORS[colorScheme ?? 'dark'];

    const translateX = useSharedValue(0);
    const openDirection = useSharedValue<'left' | 'right' | null>(null);

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onUpdate((event) => {
            // Allow swiping in both directions
            if (openDirection.value === 'left') {
                translateX.value = Math.max(-CONTINUE_WIDTH, Math.min(0, -CONTINUE_WIDTH + event.translationX));
            } else if (openDirection.value === 'right') {
                translateX.value = Math.max(0, Math.min(DELETE_WIDTH, DELETE_WIDTH + event.translationX));
            } else {
                translateX.value = Math.max(-CONTINUE_WIDTH, Math.min(DELETE_WIDTH, event.translationX));
            }
        })
        .onEnd((event) => {
            // Swipe left - Continue
            if (translateX.value < -CONTINUE_WIDTH / 2 || event.velocityX < -500) {
                translateX.value = withTiming(-CONTINUE_WIDTH, { duration: 200 });
                openDirection.value = 'left';
            }
            // Swipe right - Delete
            else if (translateX.value > DELETE_WIDTH / 2 || event.velocityX > 500) {
                translateX.value = withTiming(DELETE_WIDTH, { duration: 200 });
                openDirection.value = 'right';
            }
            // Snap back
            else {
                translateX.value = withTiming(0, { duration: 200 });
                openDirection.value = null;
            }
        });

    const tapGesture = Gesture.Tap()
        .onEnd(() => {
            if (openDirection.value !== null) {
                translateX.value = withTiming(0, { duration: 200 });
                openDirection.value = null;
            } else {
                runOnJS(onTap)(session);
            }
        });

    const gesture = Gesture.Simultaneous(panGesture, tapGesture);

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    // Continue action (left side, revealed on swipe left)
    const continueStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [-CONTINUE_WIDTH, 0], [1, 0]),
    }));

    // Delete action (right side, revealed on swipe right)
    const deleteStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateX.value, [0, DELETE_WIDTH], [0, 1]),
    }));

    const handleContinue = () => {
        translateX.value = withTiming(0, { duration: 200 });
        openDirection.value = null;
        onContinue(session.topic);
    };

    const handleDelete = () => {
        translateX.value = withTiming(0, { duration: 200 });
        openDirection.value = null;
        onDelete(session);
    };

    return (
        <View className="mb-3 overflow-hidden rounded-xl">
            {/* Continue Button (right side - revealed on swipe left) */}
            <Animated.View
                style={[
                    continueStyle,
                    {
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: CONTINUE_WIDTH,
                        backgroundColor: colors.primary,
                        borderTopRightRadius: 12,
                        borderBottomRightRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                ]}
            >
                <Pressable
                    onPress={handleContinue}
                    className="h-full w-full items-center justify-center"
                >
                    <Play size={20} color="#fff" fill="#fff" />
                    <Text className="mt-1 text-[10px] font-bold text-white">Continue</Text>
                </Pressable>
            </Animated.View>

            {/* Delete Button (left side - revealed on swipe right) */}
            <Animated.View
                style={[
                    deleteStyle,
                    {
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: DELETE_WIDTH,
                        backgroundColor: '#ef4444',
                        borderTopLeftRadius: 12,
                        borderBottomLeftRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                ]}
            >
                <Pressable
                    onPress={handleDelete}
                    className="h-full w-full items-center justify-center"
                >
                    <Trash2 size={20} color="#fff" />
                    <Text className="mt-1 text-[10px] font-bold text-white">Delete</Text>
                </Pressable>
            </Animated.View>

            {/* Card */}
            <GestureDetector gesture={gesture}>
                <Animated.View
                    style={[
                        cardStyle,
                        {
                            backgroundColor: colors.card,
                            borderRadius: 12,
                            padding: 16,
                        },
                    ]}
                >
                    <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                            <Text className="font-medium text-foreground" numberOfLines={1}>
                                {session.topic || 'Untitled Session'}
                            </Text>
                            <Text className="mt-1 text-xs text-muted-foreground">
                                {formatTime(session.start_time)}
                                {session.end_time && ` - ${formatTime(session.end_time)}`}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="font-semibold text-primary">
                                {formatDuration(session.duration_seconds)}
                            </Text>
                        </View>
                    </View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}


interface SessionHistoryModalProps {
    visible: boolean;
    topic: string | null;
    onClose: () => void;
    onContinue: (topic: string) => void;
    onTopicRenamed: () => void;
}

function SessionHistoryModal({
    visible,
    topic,
    onClose,
    onContinue,
    onTopicRenamed,
}: SessionHistoryModalProps) {
    const { colorScheme } = useColorScheme();
    const colors = PULSE_COLORS[colorScheme ?? 'dark'];
    const [sessions, setSessions] = React.useState<Session[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedTopic, setEditedTopic] = React.useState('');

    React.useEffect(() => {
        if (visible && topic) {
            setLoading(true);
            setEditedTopic(topic);
            setIsEditing(false);
            getSessionsByTopic(topic)
                .then(setSessions)
                .finally(() => setLoading(false));
        }
    }, [visible, topic]);

    const totalTime = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

    const groupedSessions = React.useMemo(() => {
        const groups: { date: string; sessions: Session[] }[] = [];
        let currentDate = '';

        sessions.forEach((session) => {
            const dateStr = formatDate(session.start_time);
            if (dateStr !== currentDate) {
                currentDate = dateStr;
                groups.push({ date: dateStr, sessions: [session] });
            } else {
                groups[groups.length - 1].sessions.push(session);
            }
        });

        return groups;
    }, [sessions]);

    const handleContinue = () => {
        if (topic) {
            onContinue(isEditing ? editedTopic : (editedTopic || topic));
            onClose();
        }
    };

    const handleSaveEdit = async () => {
        if (!topic || !editedTopic.trim()) return;

        if (editedTopic.trim() !== topic) {
            try {
                await renameAllSessionsWithTopic(topic, editedTopic.trim());
                onTopicRenamed();
                setIsEditing(false);
                const updatedSessions = await getSessionsByTopic(editedTopic.trim());
                setSessions(updatedSessions);
            } catch (error) {
                Alert.alert('Error', 'Failed to rename sessions');
            }
        } else {
            setIsEditing(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View
                    className="max-h-[80%] rounded-t-3xl"
                    style={{ backgroundColor: colors.background }}
                >
                    {/* Header */}
                    <View
                        className="flex-row items-center justify-between border-b p-5"
                        style={{ borderBottomColor: colors.border }}
                    >
                        <View className="flex-1 flex-row items-center gap-2">
                            {isEditing ? (
                                <TextInput
                                    value={editedTopic}
                                    onChangeText={setEditedTopic}
                                    autoFocus
                                    className="flex-1 rounded-lg px-3 py-2 text-lg font-bold"
                                    style={{
                                        backgroundColor: colors.muted,
                                        color: colors.foreground,
                                    }}
                                    onSubmitEditing={handleSaveEdit}
                                />
                            ) : (
                                <>
                                    <Text className="flex-1 text-xl font-bold text-foreground" numberOfLines={1}>
                                        {editedTopic || topic}
                                    </Text>
                                    <Pressable
                                        onPress={() => setIsEditing(true)}
                                        className="rounded-full p-2"
                                        style={{ backgroundColor: colors.muted }}
                                    >
                                        <Edit3 size={18} color={colors.foreground} />
                                    </Pressable>
                                </>
                            )}
                        </View>
                        {isEditing ? (
                            <Pressable
                                onPress={handleSaveEdit}
                                className="ml-2 rounded-lg px-4 py-2"
                                style={{ backgroundColor: colors.primary }}
                            >
                                <Text className="font-semibold text-white">Save</Text>
                            </Pressable>
                        ) : (
                            <Pressable
                                onPress={onClose}
                                className="ml-2 rounded-full p-2"
                                style={{ backgroundColor: colors.muted }}
                            >
                                <X size={20} color={colors.foreground} />
                            </Pressable>
                        )}
                    </View>

                    {/* Stats */}
                    <View className="flex-row border-b px-5 py-3" style={{ borderBottomColor: colors.border }}>
                        <Text className="text-sm text-muted-foreground">
                            {sessions.length} sessions · {formatDuration(totalTime)} total
                        </Text>
                    </View>

                    {/* Session List */}
                    <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 120 }}>
                        {groupedSessions.map((group, groupIndex) => (
                            <View key={groupIndex} className="mt-4">
                                <Text className="mb-2 text-sm font-semibold text-muted-foreground">
                                    {group.date}
                                </Text>
                                {group.sessions.map((session) => (
                                    <View
                                        key={session.id}
                                        className="mb-2 rounded-xl p-3"
                                        style={{ backgroundColor: colors.card }}
                                    >
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-sm text-foreground">
                                                {formatTime(session.start_time)}
                                                {session.end_time && ` - ${formatTime(session.end_time)}`}
                                            </Text>
                                            <Text className="font-semibold text-primary">
                                                {formatDuration(session.duration_seconds)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>

                    {/* Continue Button */}
                    <View
                        className="absolute bottom-0 left-0 right-0 border-t p-5"
                        style={{
                            backgroundColor: colors.background,
                            borderTopColor: colors.border,
                            paddingBottom: 34,
                        }}
                    >
                        <Pressable
                            onPress={handleContinue}
                            className="items-center rounded-2xl py-4"
                            style={{ backgroundColor: colors.primary }}
                        >
                            <Text className="text-base font-bold text-white">
                                Continue This Session
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

interface SessionListProps {
    onStartSession: (topic: string) => void;
}

export function SessionList({ onStartSession }: SessionListProps) {
    const { todaySessions, loadSessions } = useSessionStore();
    const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null);
    const [modalVisible, setModalVisible] = React.useState(false);

    React.useEffect(() => {
        loadSessions();
    }, []);

    const handleTap = (session: Session) => {
        setSelectedTopic(session.topic);
        setModalVisible(true);
    };

    const handleContinue = (topic: string) => {
        setModalVisible(false);
        onStartSession(topic);
    };

    const handleTopicRenamed = () => {
        loadSessions();
    };

    const handleDelete = (session: Session) => {
        Alert.alert(
            'Delete Session',
            `Delete "${session.topic || 'Untitled'}" (${formatDuration(session.duration_seconds)})?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteSession(session.id);
                        loadSessions();
                    },
                },
            ]
        );
    };

    if (todaySessions.length === 0) {
        return (
            <View className="flex-1 items-center justify-center px-8">
                <Text className="mb-2 text-center text-lg font-semibold text-muted-foreground">
                    No sessions today
                </Text>
                <Text className="text-center text-sm text-muted-foreground">
                    Start your first focus session to see it here
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1">
            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-foreground">
                        Today's Sessions
                    </Text>
                </View>
                {todaySessions.map((session) => (
                    <SwipeableSessionCard
                        key={session.id}
                        session={session}
                        onContinue={handleContinue}
                        onTap={handleTap}
                        onDelete={handleDelete}
                    />
                ))}
            </ScrollView>

            <SessionHistoryModal
                visible={modalVisible}
                topic={selectedTopic}
                onClose={() => setModalVisible(false)}
                onContinue={handleContinue}
                onTopicRenamed={handleTopicRenamed}
            />
        </View>
    );
}
