'use strict';

const Homey = require('homey');

/**
 * Method that acts as a promisified timeout that can be awaited
 * @param homey - Used for creating the timeout
 * @param {number} ms - Time in milis to wait
 * @returns {Promise<any>}
 */
async function timeout(homey, ms) {
  return new Promise((resolve) => {
    homey.setTimeout(() => {
      return resolve();
    }, ms);
  });
}

module.exports = {
  async getTriggers({
    homey,
  }) {
    if (!homey.app.flowCardManager) {
      await timeout(homey, 500);
    }

    const registeredTriggers = homey.app.flowCardManager.getRegisteredEvents({
      ids: ['ifttt_event'],
      type: 'trigger',
    });
    homey.app.log('api/getTriggers ->', registeredTriggers);

    return registeredTriggers;
  },

  async getActions({
    homey,
  }) {
    if (!homey.app.flowCardManager) {
      await timeout(homey, 500);
    }

    const registeredActions = homey.app.flowCardManager.getRegisteredEvents({
      ids: ['trigger_ifttt', 'trigger_ifttt_with_data'],
      type: 'action',
    });

    homey.app.log('api/getActions ->', registeredActions);
    return registeredActions;
  },
  async startAFlowWithTags({
    homey,
    body,
  }) {
    homey.app.log('api/actions/triggerAFlow');

    if (!homey.app.flowCardManager) {
      await timeout(homey, 500);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'which_flow')) {
      homey.app.log(`api/actions/triggerAFlow -> ${body.which_flow}`);

      // Check if trigger is registered on Homey upfront
      if (!homey.app.flowCardManager.getRegisteredEvents({
        ids: ['ifttt_event'],
        type: 'trigger',
      })
        .includes(body.which_flow)) {
        const notFoundError = new Error('No trigger registered on Homey for this which_flow value');
        notFoundError.code = 404;

        throw notFoundError;
      }

      // Trigger Flow
      try {
        await homey.app.flowCardManager.triggerFlowCard({
          id: 'ifttt_event',
          tokens: {
            var1: body.variable_1 || '',
            var2: body.variable_2 || '',
            var3: body.variable_3 || '',
          },
          state: {
            flow_id: body.which_flow,
          },
        });
      } catch (err) {
        homey.app.error(`api/actions/triggerAFlow -> error: failed to trigger ${body.which_flow}`, err);
        throw err;
      }
      homey.app.log(`api/actions/triggerAFlow -> triggered ${body.which_flow}`);

      return;
    }

    const badRequestError = new Error('Missing which_flow property in body');
    badRequestError.code = 400;
    throw badRequestError;
  },
  async tokenExchange({
    homey,
    body,
  }) {
    homey.app.log('api/actions/triggerAFlow');

    if (Object.prototype.hasOwnProperty.call(body, 'token')) {
      homey.app.token = body.token;
      return;
    }
    throw new Error('Missing token property in body');
  },
};
