import React, { useEffect, useState, useCallback } from "react";
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Header from "~/components/other/Header";
import useBobee from "~/hooks/useBobee";
import ChatScreen from "~/components/bobee/ChatScreen";
import SpinningLoader from "~/components/other/SpinningLoader";
import { colors } from "~/constants/Colors";
import { getAuth } from 'firebase/auth';
import Constants from 'expo-constants';

export default function BobeeChatPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const sidebarAnim = useState(new Animated.Value(0))[0]; 
  const [convos, setConvos] = useState<{ id: string; title: string; createdAt: string; updatedAt?: string }[]>([]);
  const [convosLoading, setConvosLoading] = useState(false);
  const [convosError, setConvosError] = useState<string | null>(null);
  const API_BASE = Constants.expoConfig?.extra?.backendUrl as string;

  const toggleSidebar = useCallback(() => {
    const to = showSidebar ? 0 : 1;
    setShowSidebar(!showSidebar);
    Animated.timing(sidebarAnim, { toValue: to, duration: 220, useNativeDriver: true }).start();
  }, [showSidebar, sidebarAnim]);

  const fetchConvos = useCallback(async () => {
    try {
      const user = getAuth().currentUser; if (!user) return;
      setConvosLoading(true);
      setConvosError(null);
      const idToken = await user.getIdToken(true);
      const res = await fetch(`${API_BASE}/api/list-conversations`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('list-conversations failed', res.status, text);
        throw new Error(`HTTP ${res.status} ${text || ''}`.trim());
      }
      const data = await res.json();
      if (Array.isArray(data.conversations)) {
        setConvos(data.conversations);
      } else {
        setConvos([]);
      }
    } catch (e: any) {
      setConvosError(e?.message || 'Failed to load');
    } finally {
      setConvosLoading(false);
    }
  }, [API_BASE]);
  const {
    input, setInput, history, expanded, isLoading, isDeleting,
    scrollRef, pulseAnim, toggleReasoning, handleSubmit, saveConversation, openConversation, deleteConversation,
  } = useBobee();

  const { conversationId, initialQuestion } = useLocalSearchParams<{
    conversationId?: string;
    initialQuestion?: string;
  }>();

  // On first mount: either open an existing conversation or start a new one
  const [pendingInitial, setPendingInitial] = useState<string | null>(null);
  useEffect(() => {
    // Open existing conversation
    if (conversationId && typeof conversationId === "string") {
      openConversation(conversationId);
      return;
    }
    // Start new conversation with an initial question (if provided)
    const q = typeof initialQuestion === "string" ? initialQuestion.trim() : "";
    if (q) {
      setPendingInitial(q);
      setInput(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch conversations when sidebar opens the first time or when returning to page
  useEffect(() => {
    if (showSidebar) {
      fetchConvos();
    }
  }, [showSidebar, fetchConvos]);

  // Also refresh list once on mount (silent) so it is ready when user opens sidebar
  useEffect(() => { fetchConvos(); }, [fetchConvos]);

  // Trigger handleSubmit only after input is set
  useEffect(() => {
    if (pendingInitial && input === pendingInitial) {
      handleSubmit();
      setPendingInitial(null);
    }
  }, [input, pendingInitial, handleSubmit]);

  return (
    <KeyboardAvoidingView 
      style={styles.flex} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 40} // Add offset for Android
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.lightest} />
      <Header
        title="Conversation"
        leftIcon="menu"
        onLeftPress={toggleSidebar}
      />
  {renderSidebar({ sidebarAnim, convos, convosLoading, convosError, onSelect: (id) => openConversation(id), close: () => toggleSidebar(), refresh: fetchConvos })}
      <ChatScreen
        history={history}
        expanded={expanded}
        toggleReasoning={toggleReasoning}
        scrollRef={scrollRef}
        pulseAnim={pulseAnim}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        isDeleting={isDeleting}
        onDelete={deleteConversation}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        onSaveAndBack={async () => {
          if (isSaving) return;
          try {
            setIsSaving(true);
            await saveConversation();
          } catch (e) {
            console.warn("saveConversation failed", e);
          } finally {
            router.back();
            setTimeout(() => {
              setIsSaving(false);
            }, 1000);
          }
        }}
      />
      {/* Sidebar overlay */}
    </KeyboardAvoidingView>
  );
}

interface SidebarProps {
  sidebarAnim: Animated.Value;
  convos: { id: string; title: string; createdAt: string; updatedAt?: string }[];
  convosLoading: boolean;
  convosError: string | null;
  onSelect: (id: string) => void;
  close: () => void;
  refresh: () => void;
}

function renderSidebar({ sidebarAnim, convos, convosLoading, convosError, onSelect, close, refresh }: SidebarProps) {
  const width = Math.min(Dimensions.get('window').width * 0.75, 320);
  const translateX = sidebarAnim.interpolate({ inputRange: [0,1], outputRange: [-width,0]});
  return (
    <>
      <Animated.View style={[stylesSidebar.panel,{ width, transform:[{ translateX }] }]}> 
        <View style={stylesSidebar.headerRow}>
          <Text style={stylesSidebar.title}>Your Chats</Text>
          <TouchableOpacity onPress={close}><Text style={stylesSidebar.close}>×</Text></TouchableOpacity>
        </View>
        <ScrollView refreshControl={undefined}>
          {convosLoading && (
            <View style={stylesSidebar.loadingWrap}>
              <SpinningLoader size={38} thickness={4} />
            </View>
          )}
          {!convosLoading && convosError && (
            <TouchableOpacity onPress={refresh} style={stylesSidebar.errorBox}>
              <Text style={stylesSidebar.errorText}>{convosError}. Tap to retry.</Text>
            </TouchableOpacity>
          )}
          {!convosLoading && !convosError && convos.length === 0 && (
            <Text style={stylesSidebar.empty}>No conversations yet.</Text>
          )}
          {!convosLoading && !convosError && convos.map(c => (
            <TouchableOpacity key={c.id} style={stylesSidebar.item} onPress={() => { onSelect(c.id); close(); }}>
              <Text numberOfLines={1} style={stylesSidebar.itemTitle}>{c.title || 'Untitled'}</Text>
              <Text style={stylesSidebar.itemDate}>{new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
      {/* Backdrop */}
  <Animated.View style={[stylesSidebar.backdrop, { opacity: sidebarAnim.interpolate({inputRange:[0,1],outputRange:[0,0.4]})}]} pointerEvents={'auto'}> 
        <TouchableOpacity style={{flex:1}} onPress={close} />
      </Animated.View>
    </>
  );
}

const stylesSidebar = StyleSheet.create({
  panel:{ position:'absolute', top:0, bottom:0, left:0, backgroundColor:'#fff', paddingTop:60, paddingHorizontal:16, zIndex:50, elevation:50, borderRightWidth:1, borderColor:colors.light },
  headerRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderBottomColor: colors.lighter, borderBottomWidth: 1, paddingBottom: 6, marginBottom:16 },
  title:{ fontFamily:'SpaceMono', fontSize:18, color:colors.darkest },
  close:{ fontSize:26, color:colors.dark },
  empty:{ fontFamily:'SpaceMono', fontSize:14, color:colors.dark, opacity:0.6, marginTop:20 },
  item:{ padding:10, backgroundColor: colors.lightest, borderRadius: 8, marginBottom: 8 },
  itemTitle:{ fontFamily:'SpaceMono', fontSize:16, color:colors.darkest },
  itemDate:{ fontFamily:'SpaceMono', fontSize:13, color:colors.dark, opacity:0.7, marginTop:2 },
  backdrop:{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'#000', zIndex:40 },
  errorBox:{ marginTop:20, padding:10, backgroundColor:'#fee', borderRadius:8 },
  errorText:{ fontFamily:'SpaceMono', fontSize:13, color:'rgb(119,10,10)' },
  loadingWrap:{ marginTop:30, alignItems:'center' },
});

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.lightest },
});
