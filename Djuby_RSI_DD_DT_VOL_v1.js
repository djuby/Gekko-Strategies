/*
  Djuby_RSI_DD_DT_VOL_v1

  This strategy is using RSI signal and a method to detect 2 consecutive HIGHs (DoubleTip) or
  2 consecutive LOWs (DoubleDip). It also can use candle volume to determine if there is enough
  volume to issue a trade signal. Volume is not considered when the value is set to 0. By default
  volume value is set to 0. Standard RSI and volume parameters can be configured in the strategy
  config file.

  If this strategy works for you, you can buy me a beer :-)
  LTC    - ltc1quknzed5alrjm82wus4mwrf555z9fuugr62zgwk
  BTC    - bc1qszs3c0ntlqdagsu5h60ekfx8e2m5zqg6rsw0k5
  ETH    - 0x33303293024C226d6B617b2f52e71b800e2A8c01
  XRP    - rbGTfbtp8U3bKwkoPc6KP5nVJyMAmdmNC
  DOGE   - DJHB5bj8JxKLKFfCJRPGASTxhcGuoAgcqR
  PayPal - liliap03@gmail.com  

  RSI - cykedev 14/02/2014
  (updated a couple of times since, check git history)

  Volume - added by Djuby 07/03/2021
  DoubleTip & DoubleDip - added by Djuby 21/03/2021
*/

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var RSI = require('./indicators/RSI.js');

// Djuby - defining variables needed for detecting 2 consecutive HIGHs or 2 consecutive LOWs
var DoubleTip = 0;
var DoubleDip = 0;
var Direction = 'none';

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  this.name = 'RSI';
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('rsi', 'RSI', this.settings);
}

// for debugging purposes log the last
// calculated parameters.
method.log = function(candle) {
  var digits = 8;
  var rsi = this.indicators.rsi;

  log.debug('calculated RSI properties for candle:');
  log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
  log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function() {
  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  if(rsiVal > this.settings.thresholds.high) {

    // HIGH trend detected
    if(this.trend.direction !== 'high')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'high',
        adviced: false
      };    

    this.trend.duration++;

    // Djuby - reseting DoubleDip when in HIGH direction
    if(this.trend.duration >= 1) {
        DoubleDip = 0;
    }

    // Djuby - settind DoubleTip to 1 when in the first HIGH direction. It will be set to 2 when there is a second HIGH
    // direction after the first one. In both cases duration of the trend must be at least for 2 candles.
    if(this.trend.duration >= 2 && DoubleTip < 2 && Direction !== 'high') {
        DoubleTip++;

        Direction = 'high';
    }

    log.debug('In high since', this.trend.duration, 'candle(s).');
    console.log(this.candle.start.format(), '- In high since', this.trend.duration, 'candle(s). DoubleTip: ', DoubleTip);

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced && this.candle.volume >= this.settings.tradesandvolume.volume && DoubleTip == 2) {
      this.trend.adviced = true;
      this.advice('short');
    } else
      this.advice();

  } else if(rsiVal > 0 && rsiVal < this.settings.thresholds.low) {

    // LOW trend detected
    if(this.trend.direction !== 'low')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'low',
        adviced: false
      };    

    this.trend.duration++;

    // Djuby - reseting DoubleTip when in LOW direction
    if(this.trend.duration >= 1) {
        DoubleTip = 0;
    }

    // Djuby - settind DoubleDip to 1 when in the first LOW direction. It will be set to 2 when there is a second LOW
    // direction after the first one. In both cases duration of the trend must be at least for 2 candles.
    if(this.trend.duration >= 2 && DoubleDip < 2 && Direction !== 'low') {
        DoubleDip++;

        Direction = 'low';
    }

    log.debug('In low since', this.trend.duration, 'candle(s)');
    console.log(this.candle.start.format(), '- In low since', this.trend.duration, 'candle(s). DoubleDip: ', DoubleDip);

    if(this.trend.duration >= this.settings.thresholds.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced && this.candle.volume >= this.settings.tradesandvolume.volume && DoubleDip == 2) {
      this.trend.adviced = true;
      this.advice('long');
    } else
      this.advice();

  } else {
    // Djuby - reset duration and direction since there is no trend.
    this.trend.duration = 0;
    this.trend.direction = 'none';

    Direction = 'none';

    // Djuby - reset DoubleTip if there were two consecutive HIGHs
    if(DoubleTip == 2) {
        DoubleTip = 0;
    }

    // Djuby - reset DoubleDip if there were two consecutive LOWs
    if(DoubleDip == 2) {
        DoubleDip = 0;
    }

    // Djuby - reset DoubleDip and DoubleTip if there was a single LOW followed by a single HIGH or vice versa
    if(DoubleTip == 1 && DoubleDip == 1) {
        DoubleTip = 0;
        DoubleDip = 0;
    }

    log.debug('In no trend');
    console.log('In no trend');

    this.advice();
  }
}

module.exports = method;
