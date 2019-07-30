import React, { Fragment, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLiveUpdate, useNotification } from '@inrupt/solid-react-components';
import moment from 'moment';
import { ldflexHelper, errorToaster, buildPathFromWebId, notification } from '@utils';
import ldflex from '@solid/query-ldflex';
import { namedNode } from '@rdfjs/data-model';
import tictactoeShape from '@contexts/tictactoe-shape.json';
import Board from '../Board';
import GameAccept from '../GameAccept';
import { GameWrapper, Metadata } from './game.style';

const possibleCombinations = [
  [0, 4, 8],
  [2, 4, 6],
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8]
];
type Props = { webId: String, gameURL: String };

const Game = ({ webId, gameURL }: Props) => {
  /** Game Logic */
  const updates = useLiveUpdate();
  const { timestamp } = updates;
  const [gameDocument, setGameDocument] = useState(null);
  const [gameData, setGameData] = useState({});
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inboxUrl = buildPathFromWebId(webId, process.env.REACT_APP_TICTAC_INBOX);
  const { createNotification, createInbox } = useNotification(webId);
  const [rival, setRival] = useState(null);
  const { t } = useTranslation();

  const sendNotification = useCallback(
    async (player, content) => {
      try {
        /**
         * Get full opponent game path
         */
        const gameSettings = buildPathFromWebId(
          player,
          `${process.env.REACT_APP_TICTAC_PATH}settings.ttl`
        );

        /**
         * Find opponent inboxes from a document link
         */
        const inboxes = await notification.findUserInboxes([
          { path: player, name: 'Global' },
          { path: gameSettings, name: 'Game' }
        ]);

        /**
         * If opponent doesn't have an inbox, show an error with a link to documentation
         */
        if (inboxes.length === 0)
          errorToaster(`${player} ${t('noInboxOpponent.message')}`, 'Error', {
            label: t('noInboxOpponent.link.label'),
            href: t('noInboxOpponent.link.href')
          });
        /**
         * Find the opponent's game-specific inbox. If it doesn't exist, use the global inbox instead
         * @to: Opponent inbox path
         */
        const to = notification.getDefaultInbox(inboxes, 'Game', 'Global');
        /**
         * Send notification
         */
        if (to) {
          await createNotification(content, to.path);
        }
      } catch (error) {
        errorToaster(error.message, 'Error');
      }
    },
    [gameData, inboxUrl]
  );

  /**
   * If the player's token is 'X' it will return 'O' and viceversa
   * @param {String} token Token to get the opposite
   * @returns {String} Opposite token
   */
  const getSecondToken = useCallback(token => (token === 'X' ? 'O' : 'X'));

  /**
   * Generates the moves array for the game. An array of size 9 with all of the played moves
   * @param {Array<String>} moveorder An array of moves based on moves indexes
   * @param {String} firstmove Token of the first move of the game
   * @returns {void}
   */
  const generateMoves = useCallback((moveorder: Array<String>, firstmove: String) =>
    moveorder.reduce((allSquares, current, i) => {
      const squares = allSquares;
      let move;
      if (i % 2 === 0) move = firstmove;
      else move = getSecondToken(firstmove);
      squares[current] = move;
      return squares;
    }, new Array(9).fill(null))
  );

  /**
   * Gets the entire predicate named Node based on a field property from the shape
   * @param {String} field Field to get the predicate for
   * @returns {String} Predicate for a field name
   */
  const getPredicate = useCallback(field => {
    const prefix = tictactoeShape['@context'][field.prefix];
    return `${prefix}${field.predicate}`;
  });

  /**
   * Checks if it's the user's turn by comparing the gamestatus with the user's token
   * @param {String} gamestatus Status of the game
   * @param {String} token Player's token
   * @returns {Boolean}
   */
  const canPlay = useCallback(({ gamestatus, token }) => {
    const isStatusValid = gamestatus && gamestatus.includes('Move');
    return isStatusValid ? gamestatus.includes(token) : false;
  });

  /**
   * Updates the game status in the game document
   * @param {String} gamestatus New status for the game to be updated to
   */
  const changeGameStatus = useCallback(
    async gamestatus => {
      try {
        const predicate = 'http://www.w3.org/2000/01/rdf-schema#gamestatus';
        await gameDocument[predicate].set(gamestatus);
      } catch (e) {
        throw e;
      }
    },
    [gameDocument]
  );

  /**
   * Get basic info for a player (name and image url)
   * @param {String} webId WebId of the player to look the Info for
   * @returns {Object} An object with the basic information of the player
   */
  const getPlayerInfo = async webId => {
    try {
      const nameData = await ldflex[webId]['vcard:fn'];
      const imageData = await ldflex[webId]['vcard:hasPhoto'];
      const name = nameData ? nameData.value : webId;
      const image = imageData ? imageData.value : '/img/icon/empty-profile.svg';
      return { name, image, webId };
    } catch (e) {
      throw e;
    }
  };

  /**
   * Adds the game document as a link in the opponent's data.ttl file
   */
  const addGameToList = async () => {
    const url = buildPathFromWebId(webId, process.env.REACT_APP_TICTAC_PATH);
    await ldflex[`${url}/data.ttl`]['ldp:contains'].add(namedNode(gameURL));
  };

  /**
   * Accepts the game by changing the status of it to 'Accepted', adding it to the game list and sending a notification to the actor
   * @param {Function} cb Function to execute once the game has been accepted
   */
  const onAccept = async cb => {
    try {
      await changeGameStatus('Move X');
      await addGameToList();
      await sendNotification(rival.webId, {
        title: 'Tictactoe game accepted',
        summary: 'has accepted your invitation to play a game of TicTacToe.',
        actor: webId,
        object: gameURL,
        target: window.location.href
      });
      cb();
    } catch (e) {
      setIsProcessing(false);
      errorToaster(e.message, 'Error');
    }
  };
  /**
   * Declines the game by changing the status of it to 'Declined' and sending a notification to the actor
   * @param {Function} cb Function to execute once the game has been declined
   */
  const onDecline = async cb => {
    try {
      await changeGameStatus('Declined');
      await sendNotification(rival.webId, {
        title: 'Tictactoe game declined',
        summary: 'has declined your invitation to play a game of TicTacToe.',
        actor: webId,
        object: gameURL,
        target: window.location.href
      });
      cb();
    } catch (e) {
      errorToaster(e.message, 'Error');
    }
  };

  /**
   * Gets the rival based on wether or not the player is the owner
   * @param {Object} gameData Actor, opponent and owner of the game
   * @returns {Object} Rival data
   */
  const getRival = ({ actor, opponent, owner }) => (owner ? opponent : actor);

  /**
   * Gets the raw data from the game's turtle file using ldflex
   * @returns {Object} An Object with all of the turtle file data
   */
  const fetchRawData = async () => {
    const game = await ldflexHelper.fetchLdflexDocument(gameURL);
    setGameDocument(game);
    let data = {};
    for await (const field of tictactoeShape.shape) {
      const fieldData = await game[getPredicate(field)];
      data = { ...data, [field.predicate]: fieldData.value };
    }
    return data;
  };

  /**
   *  Checks wether or not there is a winner or a tie (game is over)
   * @param {Array} moves Array of game's moves
   * @return {Object} A winner object
   */
  const checkForWinnerOrTie = (moves: Array) => {
    if (!moves) return null;
    const isMovesFull = moves.filter(move => move === null).length === 0;
    let gameResult = {};
    for (const combination of possibleCombinations) {
      const [first, second, third] = combination;
      if (
        moves[first] !== null &&
        moves[first] === moves[second] &&
        moves[first] === moves[third]
      ) {
        gameResult = { win: true, combination, token: moves[first], finished: true };
        break;
      }
    }
    if (!gameResult.win && isMovesFull) gameResult = { win: false, finished: true };
    setResult(gameResult);
    return gameResult;
  };

  /**
   * If there's a winner or a tie, the gamestatus gets changed to 'Finished'
   * @param {Object} data Game data
   */
  const checkWinnerOrNextPlayer = useCallback(
    async data => {
      const { moves } = data;
      const result = await checkForWinnerOrTie(moves);
      const gamestatus = result.finished ? 'Finished' : data.gamestatus;
      await changeGameStatus(gamestatus);
    },
    [gameData]
  );

  /**
   * Gets the game for an initial render and sets the basic game data
   */
  const getInitialGame = useCallback(async () => {
    try {
      const gameDocData = await fetchRawData();
      const actor = await getPlayerInfo(gameDocData.actor);
      const opponent = await getPlayerInfo(gameDocData.opponent);
      const owner = webId === actor.webId;
      const rival = getRival({ actor, opponent, owner });
      const token = owner ? getSecondToken(gameDocData.firstmove) : gameDocData.firstmove;
      const moveorder = gameDocData.moveorder ? gameDocData.moveorder.split('-') : [];
      const moves = generateMoves(moveorder, gameDocData.firstmove);
      const myTurn = canPlay({
        gamestatus: gameDocData.gamestatus,
        moves,
        token
      });
      const newData = {
        ...gameDocData,
        actor,
        opponent,
        moveorder,
        moves,
        owner,
        rival,
        token,
        canPlay: myTurn
      };
      setRival(rival);
      setGameData(newData);
      if (gameDocData.gamestatus === 'Finished') checkForWinnerOrTie(moves);
    } catch (e) {
      errorToaster(e.message);
    }
  });

  /**
   * Gets game for any fetch except the initial one
   * Set the moves, the game status and wether or not is my turn for the game data
   */
  const getGame = useCallback(async () => {
    try {
      const gameDocData = await fetchRawData();
      if (gameDocData.gamestatus === gameData.gamestatus) {
        return;
      }
      const moveorder = gameDocData.moveorder ? gameDocData.moveorder.split('-') : [];
      const { gamestatus } = gameDocData;
      const moves = generateMoves(moveorder, gameDocData.firstmove);
      const myTurn = canPlay({
        gamestatus: gameDocData.gamestatus,
        moves,
        token: gameData.token
      });
      const newData = { ...gameData, moveorder, moves, canPlay: myTurn, gamestatus };
      setGameData(newData);
      if (gamestatus === 'Finished') checkForWinnerOrTie(moves);
    } catch (e) {
      errorToaster(e.message, 'Error');
    }
  }, [gameURL, gameData]);

  const addMoves = useCallback(async array => {
    try {
      const moves = array.join('-');
      const predicate = 'http://www.w3.org/2000/01/rdf-schema#moveorder';
      await gameDocument[predicate].delete();
      await gameDocument[predicate].add(moves);
    } catch (e) {
      throw e;
    }
  });

  /**
   * Generate a new move for the game, checks if the game is done and sends a notification to the rival
   * @param {String} index Index of the move about to be make
   */
  const onMove = useCallback(
    async index => {
      try {
        setIsProcessing(true);
        const { moves, moveorder, token, rival } = gameData;
        if (moves[index] === null) {
          const newMoves = moves;
          newMoves[index] = token;
          const newOrder = [...moveorder, index];
          const gamestatus = `Move ${getSecondToken(token)}`;
          const newData = {
            ...gameData,
            moveorder: newOrder,
            moves: newMoves,
            gamestatus,
            canPlay: canPlay({ gamestatus, lastmove: token, token })
          };
          setGameData(newData);
          await addMoves(newOrder);
          await checkWinnerOrNextPlayer(newData);

          await sendNotification(rival.webId, {
            title: 'Tictactoe move',
            summary: 'A move has been made in your Tic-Tac-Toe game.',
            actor: webId,
            object: gameURL,
            target: window.location.href
          });
          setIsProcessing(false);
        }
      } catch (e) {
        setIsProcessing(false);
        errorToaster(e.message, 'Error');
      }
    },
    [gameData]
  );

  /**
   * Executes when the game is mounted the first time
   */
  useEffect(() => {
    try {
      const gamePath = buildPathFromWebId(webId, process.env.REACT_APP_TICTAC_PATH);
      if (gameURL) {
        createInbox(`${gamePath}inbox/`, gamePath);
        getInitialGame();
      }
    } catch (e) {
      /**
       * Check if something fails when we try to create a inbox
       * and show user a possible solution
       */
      if (e.name === 'Inbox Error') {
        return errorToaster(e.message, 'Error', {
          label: t('errorCreateInbox.link.label'),
          href: t('errorCreateInbox.link.href')
        });
      }
      errorToaster(e.message, 'Error');
    }
  }, []);

  /**
   * Executes everytime the gameUrl changes or when the Live update detects a change
   */
  useEffect(() => {
    if ((gameURL || timestamp) && !isProcessing && gameData.actor) getGame();
  }, [gameURL, timestamp]);
  return (
    <GameWrapper data-testid="game">
      {Object.keys(gameData).length > 0 && (
        <Fragment>
          {!gameData.owner &&
            (gameData.gamestatus === 'Awaiting' || gameData.gamestatus === 'Invite Sent') && (
              <GameAccept {...{ ...gameData, onAccept, onDecline }} />
            )}
          <Metadata>
            {
              <div>
                {t('game.playingAgainst')}
                {rival && (
                  <a href={rival.webId}>
                    <strong>{rival.name}</strong>
                  </a>
                )}
              </div>
            }

            {!result && !gameData.canPlay && <span>{t('game.notYourTurn')}</span>}
            {result && result.finished && (
              <div>
                {result.win &&
                  (result.token === gameData.token ? (
                    <span>{t('game.winnerMsg')}</span>
                  ) : (
                    <span>{t('game.loserMsg')}</span>
                  ))}
                {!result.win && <span>{t('game.tieMsg')}</span>}
              </div>
            )}
            <span>
              {t('game.status')}
              <b>{gameData.gamestatus}</b>
            </span>
          </Metadata>
          {gameData.moves && (
            <Board
              {...{
                squares: gameData.moves,
                onMove,
                canPlay: gameData.canPlay,
                result
              }}
            />
          )}
          {gameData && (
            <Metadata>
              <span>
                {t('game.created')}
                <b>{moment(gameData.createddatetime).format('MMM Do, YYYY')}</b>
              </span>
              {result && result.win ? (
                <Fragment>
                  <span>
                    {t('game.winnerObject')}
                    <strong>{result.token}</strong> with <b>{result.combination.join('-')}</b>
                  </span>
                </Fragment>
              ) : (
                <span>
                  {t('game.token')}
                  <strong>{gameData.token}</strong>
                </span>
              )}
            </Metadata>
          )}
        </Fragment>
      )}
    </GameWrapper>
  );
};

export default Game;
