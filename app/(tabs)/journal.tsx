import { StyleSheet, View } from 'react-native';
import JournalMic from '~/components/journal/JournalMic';
import JournalPrompt from '~/components/journal/JournalPrompt';
import JournalResponse from '~/components/journal/JournalResponse';
import JournalLoading from '~/components/journal/JournalLoading';
import JournalLimitBanner from '~/components/journal/JournalLimitBanner';
import ErrorBanner from '~/components/banners/ErrorBanner';
import SuccessBanner from '~/components/banners/SuccessBanner';
import { useJournalRecording } from '~/hooks/useJournals';
import { colors } from '~/constants/Colors';

export default function Journal() {
  const journal = useJournalRecording();

  return (
    <>
      {journal.error && (
        <ErrorBanner
          message={journal.error}
          onHide={journal.clearError}
        />
      )}

      {journal.successBannerVisible && (
        <SuccessBanner
          message="Journal submitted"
          onHide={journal.clearSuccessBanner}
        />
      )}

      <View style={styles.container}>
        <JournalLimitBanner visible={journal.limitBannerVisible} />

        {journal.aiResponse ? (
          <JournalResponse
            aiResponse={journal.aiResponse}
            onUpgrade={journal.handleUpgrade}
            onUpgradeTwo={journal.handleUpgradeTwo}
            subscribeLoading={journal.subscribeLoading}
            secondSubscribeLoading={journal.secondSubscribeLoading}
            onSubmit={journal.handleSubmitJournal}
            submitLoading={journal.submitLoading}
            wordCount={journal.wordCount}
            currentStreak={journal.currentStreak}
          />
        ) : (
          <>
            <JournalPrompt prompt={journal.prompt} loading={journal.loading} />

            <View style={styles.centerContent}>
              <JournalMic
                onClearPrompt={journal.clearPrompt}
                isRecording={journal.isRecording}
                onGenerate={journal.generatePrompt}
                prompt={journal.prompt}
                loading={journal.loading}
                timer={journal.timer}
                onToggle={journal.toggleRecording}
                pulseAnim={journal.pulseAnim}
              />

              <JournalLoading
                loading={journal.loading}
                loadingStage={journal.loadingStage}
              />
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: colors.lightest,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  centerContent: {
    position: 'absolute',
    top: 300,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorText: {
    color: '#D33',
    textAlign: 'center',
    marginTop: 36,
    fontFamily: 'SpaceMono',
  },
});
