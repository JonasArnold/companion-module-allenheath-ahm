import {
	getChoicesArrayWithIncrementingNumbers,
	getChoicesArrayOf1DArray,
	getChoicesArrayOfKeyValueObject,
} from './helpers.js'
import { dbu_Values, PlaybackChannel } from './constants.js'

/**
 * Builds dropdown options for Companion Actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty 
 * @param {Number} offset 
 * @returns {Object[]}
 */
export function listOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
	]
}

/**
 * Builds Companion Action Options for mute actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty 
 * @param {Number} offset 
 * @returns {Object[]}
 */
export function muteOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'mute_number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
		{
			type: 'checkbox',
			id: 'mute',
			label: 'Mute',
			default: true,
		},
	]
}

/**
 * Builds Companion Action Options for set level actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty 
 * @param {Number} offset 
 * @returns {Object[]}
 */
export function setLevelOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'setlvl_ch_number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
		{
			type: 'dropdown',
			id: 'level',
			label: 'Set Level (dBu)',
			default: '0',
			choices: getChoicesArrayOf1DArray(dbu_Values),
		},
	]
}

/**
 * Builds Companion Action Options for inc/dec level actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty 
 * @param {Number} offset 
 * @returns {Object[]}
 */
export function incDecOptions(name, qty, offset) {
	return [
		{
			type: 'dropdown',
			id: 'incdec_ch_number',
			label: name,
			default: 0,
			choices: getChoicesArrayWithIncrementingNumbers(name, qty, offset),
			minChoicesForSearch: 0,
		},
		{
			type: 'dropdown',
			id: 'incdec',
			label: 'Increment/Decrement',
			default: 'inc',
			choices: [
				{ id: 'inc', label: 'Increment' },
				{ id: 'dec', label: 'Decrement' },
			],
		},
	]
}

/**
 * Builds Companion Action Options for playback actions
 * @param {String} name - leading text for dropdown options
 * @param {Number} qty 
 * @param {Number} offset 
 * @returns {Object[]}
 */
export function playbackChannelOptions(name) {
	return [
		{
			type: 'dropdown',
			id: 'playbackChannel',
			label: name,
			default: 0,
			choices: getChoicesArrayOfKeyValueObject(PlaybackChannel),
			minChoicesForSearch: 0,
		},
	]
}
