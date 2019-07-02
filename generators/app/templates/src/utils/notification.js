import { ldflexHelper, buildPathFromWebId } from './index';

export const sendNotification = async (opponent, content, createNotification) => {
  try {
    /**
     * Opponent app inbox
     */
    const opponentAppInbox = buildPathFromWebId(opponent, process.env.REACT_APP_TICTAC_INBOX);
    /**
     * Check if app inbox exist to send notification if doesn't exist
     * send try to send to global inbox.
     */
    const appInbox = await ldflexHelper.existFolder(opponentAppInbox);
    if (appInbox) {
      return createNotification(content, opponentAppInbox);
    }
    const globalOpponentInbox = await ldflexHelper.discoveryInbox(opponent);
    if (globalOpponentInbox) {
      return createNotification(content, `${globalOpponentInbox}/`);
    }

    /**
     * If the opponent doesn't has inbox we show an error
     */
    throw new Error('Error the opponent does not has inbox to send notification');
  } catch (error) {
    throw error;
  }
};
