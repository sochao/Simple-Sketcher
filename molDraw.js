/*
 * Simple Sketcher
 * Copyright (c) 2023 Ondrej Socha and IOCB Prague
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';
var molEdit = (function (){
var UI_VISIBLE = false
const smallScreen = 670;
var SELECTING_RECT_FILL = 'rgb(220, 235, 255)',
SELECTING_RECT_OUTLINE = 'rgb(130, 170, 255)',
SELECTED_COLOR_BOND = 'rgb(150, 190, 255)',
SELECTED_COLOR_ATOM = 'rgb(230, 140, 255)',
HOVER_COLOR = 'rgba(245, 206, 66, 0.5)',

SELECTING_RECT_LINE_WIDTH = 0.5,
PASTING_LINE_COLOR = 'rgba(100,150,255,0.8)',
INVALID_COLOR = 'rgba(255,0,0,0.7)';

var LINE_COLOR = 'black';
var LINE_WIDTH = 2,
LINE_LENGTH = 50,
POINT_HOVER_RADIUS = 14,
LINE_HOVER_WIDTH = 20,
DOUBLE_BOND_SPREAD = 6,
TRIPLE_BOND_SPREAD = 10,
TRIM_SIZE = 10,
FONT_SIZE = 16,
FONT_SUB_SIZE = 12,
FONT_SUB_OFFSET_Y = 6,
FONT_SUP_OFFSET_Y = 7;

const ATOM_VERTICAL_CENTERING = 5.8;

const SNAP_ANGLE_STEP = 15, //deg
DBOND_TRIM = 10;

const NUM_TOL = 1E-10, 
MERGE_TOL = 5, //px
EDITOR_MARGIN = 20,
NO_MOVE_TOL = 3; //px

const MODE_DRAW_IDLE = 0,
MODE_DRAWING = 1,
MODE_SELECTING = 2,
MODE_PASTING = 3,
MODE_IDLE = 4,
MODE_DRAW_CHARGE_PLUS = 5,
MODE_DRAW_CHARGE_MINUS = 6,
MODE_DRAW_FRAGMENT = 7,
MODE_ERASER = 8;

const drawingModes = [MODE_DRAW_IDLE, MODE_DRAW_CHARGE_PLUS,
					 MODE_DRAW_CHARGE_MINUS, MODE_DRAW_FRAGMENT];

const ELEMENTS_TABLE = {
	'C': {atNo: 6, valency: [4], name: 'Carbon'},
	'N': {atNo: 7, valency: [3,5], name: 'Nitrogen'},
	'O': {atNo: 8, valency: [2], name: 'Oxygen'},
	'S': {atNo: 16, valency: [2,4,6], name: 'Sulphur'},
	'F': {atNo: 9, valency: [1], name: 'Fluorine'},
	'Cl': {atNo: 17, valency: [1], name: 'Chlorine'},
	'Br': {atNo: 35, valency: [1], name: 'Bromine'},
	'I': {atNo: 53, valency: [1], name: 'Iodine'},
};

const HOTKEYS_ATOMS = {
	'c' : 'C',
	'n' : 'N',
	'o' : 'O',
	's' : 'S',
	'f' : 'F',
	'l' : 'Cl',
	'b' : 'Br',
	'i' : 'I',
};

const ICONS = {
	'undo' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 98.86"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style><g><path class="st0" d="M0,49.43l48.93,49.43V74.23c30.94-6.41,55.39,0.66,73.95,24.19c-3.22-48.4-36.29-71.76-73.95-73.31V0L0,49.43 L0,49.43L0,49.43z"/></g></svg>',
	'redo' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 98.86"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style><g><path class="st0" d="M122.88,49.43L73.95,98.86V74.23C43.01,67.82,18.56,74.89,0,98.42c3.22-48.4,36.29-71.76,73.95-73.31l0-25.11 L122.88,49.43L122.88,49.43z"/></g></svg>',
	'pencil' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 106.67 122.88"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style><g><path class="st0" d="M87.73,0c1.3-0.01,2.42,0.43,3.39,1.35l14.16,13.55c0.92,0.88,1.37,2.04,1.39,3.32 c0.02,1.3-0.36,2.49-1.26,3.39l-7.54,7.84L76.95,9.25l7.46-7.77C85.32,0.53,86.43,0.02,87.73,0L87.73,0L87.73,0z M21.44,72.88 c2.56-0.79,5.26,0.65,6.05,3.2c0.79,2.56-0.65,5.26-3.2,6.05c-7.45,2.28-12.44,6.7-14.1,10.85c-0.44,1.11-0.59,2.12-0.42,2.96 c0.13,0.63,0.51,1.21,1.14,1.66c2.72,1.99,8.58,2.5,18.42,0.11c4.76-1.16,2.81-0.68,5.99-1.27c6.32-1.17,12.63-1.97,17.72-1.72 c6.68,0.33,11.7,2.48,13.41,7.61c1.11,3.32,0.8,6.2,0.52,8.78c-0.1,0.93-0.19,1.79-0.15,2.36c0,0.02,1.01-0.05,5.9-0.44 c5.66-0.45,11.52-2.68,17.3-4.89c2.97-1.13,5.91-2.25,9.25-3.28c2.56-0.78,5.26,0.67,6.03,3.22c0.78,2.56-0.67,5.26-3.22,6.03 c-2.59,0.79-5.59,1.94-8.6,3.08c-6.45,2.46-12.96,4.94-20,5.5c-12.88,1.01-15.87-2.63-16.33-8.48c-0.11-1.38,0.03-2.71,0.18-4.14 c0.17-1.6,0.36-3.39-0.07-4.69c-0.19-0.58-2.02-0.88-4.68-1c-4.26-0.21-9.84,0.51-15.52,1.57c-2.83,0.52-0.8,0.02-5.45,1.15 c-12.96,3.15-21.57,1.81-26.39-1.71c-2.71-1.97-4.32-4.56-4.94-7.47c-0.58-2.71-0.25-5.63,0.91-8.54 C3.81,82.85,11.04,76.06,21.44,72.88L21.44,72.88L21.44,72.88z M44.06,51.71l12.84,12.35l-15.7,4.22 c-0.57,0.11-0.79-0.12-0.69-0.64L44.06,51.71L44.06,51.71L44.06,51.71z M70.31,16.13l20.91,20.14L62.66,66.41l-25.59,6.86 c-0.92,0.18-1.28-0.18-1.13-1.05l5.8-25.94L70.31,16.13L70.31,16.13L70.31,16.13z"/></g></svg>',
	'select' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 121.65 122.88"><g><path d="M1.96,0.28L1.91,0.3L1.88,0.32c-0.07,0.03-0.13,0.06-0.19,0.1L1.67,0.43L1.61,0.46L1.58,0.48C1.55,0.5,1.52,0.52,1.49,0.54 l0,0L1.45,0.57L1.44,0.57L1.41,0.59L1.38,0.61L1.34,0.64L1.29,0.68l-0.01,0C0.73,1.11,0.33,1.69,0.14,2.36 C0.03,2.7-0.01,3.07,0,3.43v2.05c0.02,2.55,2.78,4.12,4.98,2.8c0.67-0.41,1.15-1.02,1.4-1.73h3.46c2.55-0.02,4.12-2.78,2.8-4.98 C12.03,0.59,11,0.01,9.84,0H3.42C2.94-0.02,2.44,0.07,1.96,0.28L1.96,0.28z M101.11,122.86c0.09,0.02,0.19,0.02,0.29,0 c0.03-0.02,0.07-0.04,0.1-0.05l9.76-5.63c0.09-0.06,0.15-0.16,0.18-0.26c0.02-0.08,0.02-0.16-0.01-0.21l-10.7-18.65l0,0 c-0.09-0.16-0.15-0.33-0.19-0.51c-0.19-0.94,0.41-1.85,1.35-2.04l15.7-3.25c0.02-0.01,0.04-0.01,0.06-0.01 c1.35-0.28,2.5-0.76,3.26-1.36c0.37-0.29,0.62-0.59,0.72-0.87c0.06-0.18,0.03-0.39-0.09-0.63c-0.22-0.41-0.66-0.87-1.39-1.36 L66.79,51.49l4.95,64.46c0.07,0.88,0.24,1.49,0.48,1.88c0.14,0.23,0.31,0.35,0.5,0.39c0.29,0.06,0.67-0.01,1.11-0.18 c0.9-0.36,1.88-1.12,2.81-2.15l10.71-12.02l0,0c0.12-0.13,0.26-0.25,0.43-0.35c0.83-0.48,1.89-0.2,2.37,0.63l10.8,18.59 C100.97,122.8,101.03,122.84,101.11,122.86L101.11,122.86L101.11,122.86z M1.61,0.46C1.57,0.49,1.53,0.51,1.49,0.54L1.61,0.46 L1.61,0.46z M6.56,18.59c-0.02-2.55-2.78-4.12-4.98-2.8C0.59,16.4,0.01,17.43,0,18.59v6.55c0.02,2.55,2.78,4.12,4.98,2.8 c0.99-0.61,1.57-1.64,1.58-2.8V18.59L6.56,18.59z M6.56,38.26c-0.02-2.55-2.78-4.12-4.98-2.8C0.59,36.06,0.01,37.1,0,38.26v6.55 c0.02,2.55,2.78,4.12,4.98,2.8c0.99-0.61,1.57-1.64,1.58-2.8V38.26L6.56,38.26z M6.56,57.92c-0.02-2.55-2.78-4.12-4.98-2.8 c-0.99,0.61-1.57,1.64-1.58,2.8v6.56c0.02,2.55,2.78,4.12,4.98,2.8c0.99-0.61,1.57-1.64,1.58-2.8V57.92L6.56,57.92z M6.56,77.59 c-0.02-2.55-2.78-4.12-4.98-2.8c-0.99,0.61-1.57,1.64-1.58,2.8v6.55c0.02,2.55,2.78,4.12,4.98,2.8c0.99-0.61,1.57-1.64,1.58-2.8 V77.59L6.56,77.59z M6.56,97.25c-0.02-2.55-2.78-4.12-4.98-2.8c-0.99,0.61-1.57,1.64-1.58,2.8v6.56c0.02,2.55,2.78,4.12,4.98,2.8 c0.99-0.61,1.57-1.64,1.58-2.8V97.25L6.56,97.25z M13.13,103.79c-2.55,0.02-4.12,2.78-2.8,4.98c0.61,0.99,1.64,1.57,2.8,1.58h6.55 c2.55-0.02,4.12-2.78,2.8-4.98c-0.61-0.99-1.64-1.57-2.8-1.58H13.13L13.13,103.79z M32.79,103.79c-2.55,0.02-4.12,2.78-2.8,4.98 c0.61,0.99,1.64,1.57,2.8,1.58h6.56c2.55-0.02,4.12-2.78,2.8-4.98c-0.61-0.99-1.64-1.57-2.8-1.58H32.79L32.79,103.79z M52.46,103.79c-2.55,0.02-4.12,2.78-2.8,4.98c0.61,0.99,1.64,1.57,2.8,1.58h6.56c2.55-0.02,4.12-2.78,2.8-4.98 c-0.61-0.99-1.64-1.57-2.8-1.58H52.46L52.46,103.79z M103.79,63.36c0.02,2.55,2.78,4.12,4.98,2.8c0.99-0.61,1.57-1.64,1.58-2.8 v-6.56c-0.02-2.55-2.78-4.12-4.98-2.8c-0.99,0.61-1.57,1.64-1.58,2.8V63.36L103.79,63.36z M103.79,43.7 c0.02,2.55,2.78,4.12,4.98,2.8c0.99-0.61,1.57-1.64,1.58-2.8v-6.56c-0.02-2.55-2.78-4.12-4.98-2.8c-0.99,0.61-1.57,1.64-1.58,2.8 V43.7L103.79,43.7z M103.79,24.03c0.02,2.55,2.78,4.12,4.98,2.8c0.99-0.61,1.57-1.64,1.58-2.8v-6.55c-0.02-2.55-2.78-4.12-4.98-2.8 c-0.99,0.61-1.57,1.64-1.58,2.8V24.03L103.79,24.03z M104.63,6.56c0.99,1.1,2.69,1.49,4.14,0.61c0.99-0.61,1.57-1.64,1.58-2.8V3.42 c0.03-0.61-0.12-1.25-0.47-1.84c-0.61-0.99-1.64-1.57-2.8-1.58h-5.47c-2.55,0.02-4.12,2.78-2.8,4.98c0.61,0.99,1.64,1.57,2.8,1.58 H104.63L104.63,6.56z M88.5,6.56c2.55-0.02,4.12-2.78,2.8-4.98C90.69,0.59,89.66,0.01,88.5,0h-6.55c-2.55,0.02-4.12,2.78-2.8,4.98 c0.61,0.99,1.64,1.57,2.8,1.58H88.5L88.5,6.56z M68.83,6.56c2.55-0.02,4.12-2.78,2.8-4.98c-0.61-0.99-1.64-1.57-2.8-1.58h-6.56 c-2.55,0.02-4.12,2.78-2.8,4.98c0.61,0.99,1.64,1.57,2.8,1.58H68.83L68.83,6.56z M49.17,6.56c2.55-0.02,4.12-2.78,2.8-4.98 c-0.61-0.99-1.64-1.57-2.8-1.58h-6.56c-2.55,0.02-4.12,2.78-2.8,4.98c0.61,0.99,1.64,1.57,2.8,1.58H49.17L49.17,6.56z M29.5,6.56 c2.55-0.02,4.12-2.78,2.8-4.98C31.7,0.59,30.66,0.01,29.5,0h-6.55c-2.55,0.02-4.12,2.78-2.8,4.98c0.61,0.99,1.64,1.57,2.8,1.58 H29.5L29.5,6.56z"/></g></svg>',
	'cut' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 105.78 122.88"><style type="text/css">.st0{fill-rule:evenodd;clip-rule:evenodd;}</style><g><path class="st0" d="M85.94,27.52C91.11,16.47,91.02,7.34,86.04,0L55.09,53.71l7.69,13.64L85.94,27.52L85.94,27.52z M19.84,27.52 C14.67,16.47,14.76,7.34,19.74,0l37.45,64.99c1.74,2.25,2.82,4.64,2.96,7.22c0.13,2.41-0.56,3.29-0.95,5.39 c-0.32,1.76-0.14,3.55,1.03,5.4l1.56,1.71c1.4,1.53,2.6,3.37,4.97,3.07c1.58-0.2,2.91-1.54,4.06-3.69c1.48-1.63,3.21-2.9,5.19-3.78 c1.92-0.85,4.07-1.34,6.48-1.45c7.55,0.39,14.08,3.91,18.98,12.41c5.94,9.68,5.26,17.86,0.85,25.18c-3.4,4.46-7.5,6.42-12.17,6.43 c-7.12,0.01-12.9-3.41-17.38-8.73c-2.84-3.37-5.2-7.42-7.68-11.93l-9.03-11.54L55,87.98L19.84,27.52L19.84,27.52z M53.11,67.8 c1.98,0,3.58,1.6,3.58,3.58c0,1.98-1.6,3.58-3.58,3.58c-1.97,0-3.58-1.6-3.58-3.58C49.53,69.4,51.13,67.8,53.11,67.8L53.11,67.8z M75.36,90.03c2.55-3.9,6.85-4.31,10.95-2.87c3.29,1.16,6.13,3.62,8.53,7.32c2.02,3.12,3.59,8.15,3.19,12.51 c-0.78,8.45-8.3,10.05-14.86,6.36c-2.92-1.64-5.24-4.07-6.92-7.37c-1.13-2.23-2.09-4.87-2.45-7.54 C73.4,95.49,73.73,92.51,75.36,90.03L75.36,90.03z M46.56,80.59c-0.17,0.79-0.5,1.59-1.01,2.4l-1.56,1.71 c-1.4,1.53-2.6,3.37-4.97,3.07c-1.58-0.2-2.91-1.54-4.06-3.69c-1.48-1.63-3.21-2.9-5.19-3.78c-1.92-0.85-4.07-1.34-6.48-1.45 c-7.55,0.39-14.08,3.91-18.98,12.41c-5.94,9.68-5.26,17.86-0.85,25.18c3.4,4.46,7.5,6.42,12.17,6.43 c7.12,0.01,12.9-3.41,17.38-8.73c2.84-3.37,5.2-7.42,7.68-11.93l10.63-13.58l-0.35-0.6l-0.11-0.18L46.56,80.59L46.56,80.59z M30.43,90.03c-2.55-3.9-6.85-4.31-10.95-2.87c-3.29,1.16-6.13,3.62-8.53,7.32C8.93,97.6,7.36,102.63,7.77,107 c0.78,8.45,8.3,10.05,14.86,6.36c2.92-1.64,5.24-4.07,6.92-7.37c1.13-2.23,2.09-4.87,2.45-7.54 C32.39,95.49,32.05,92.51,30.43,90.03L30.43,90.03z"/></g></svg>',
	'copy' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 102.17 122.88"><path d="M102.17,29.66A3,3,0,0,0,100,26.79L73.62,1.1A3,3,0,0,0,71.31,0h-46a5.36,5.36,0,0,0-5.36,5.36V20.41H5.36A5.36,5.36,0,0,0,0,25.77v91.75a5.36,5.36,0,0,0,5.36,5.36H76.9a5.36,5.36,0,0,0,5.33-5.36v-15H96.82a5.36,5.36,0,0,0,5.33-5.36q0-33.73,0-67.45ZM25.91,20.41V6h42.4V30.24a3,3,0,0,0,3,3H96.18q0,31.62,0,63.24h-14l0-46.42a3,3,0,0,0-2.17-2.87L53.69,21.51a2.93,2.93,0,0,0-2.3-1.1ZM54.37,30.89,72.28,47.67H54.37V30.89ZM6,116.89V26.37h42.4V50.65a3,3,0,0,0,3,3H76.26q0,31.64,0,63.24ZM17.33,69.68a2.12,2.12,0,0,1,1.59-.74H54.07a2.14,2.14,0,0,1,1.6.73,2.54,2.54,0,0,1,.63,1.7,2.57,2.57,0,0,1-.64,1.7,2.16,2.16,0,0,1-1.59.74H18.92a2.15,2.15,0,0,1-1.6-.73,2.59,2.59,0,0,1,0-3.4Zm0,28.94a2.1,2.1,0,0,1,1.58-.74H63.87a2.12,2.12,0,0,1,1.59.74,2.57,2.57,0,0,1,.64,1.7,2.54,2.54,0,0,1-.63,1.7,2.14,2.14,0,0,1-1.6.73H18.94a2.13,2.13,0,0,1-1.59-.73,2.56,2.56,0,0,1,0-3.4ZM63.87,83.41a2.12,2.12,0,0,1,1.59.74,2.59,2.59,0,0,1,0,3.4,2.13,2.13,0,0,1-1.6.72H18.94a2.12,2.12,0,0,1-1.59-.72,2.55,2.55,0,0,1-.64-1.71,2.5,2.5,0,0,1,.65-1.69,2.1,2.1,0,0,1,1.58-.74ZM17.33,55.2a2.15,2.15,0,0,1,1.59-.73H39.71a2.13,2.13,0,0,1,1.6.72,2.61,2.61,0,0,1,0,3.41,2.15,2.15,0,0,1-1.59.73H18.92a2.14,2.14,0,0,1-1.6-.72,2.61,2.61,0,0,1,0-3.41Zm0-14.47A2.13,2.13,0,0,1,18.94,40H30.37a2.12,2.12,0,0,1,1.59.72,2.61,2.61,0,0,1,0,3.41,2.13,2.13,0,0,1-1.58.73H18.94a2.16,2.16,0,0,1-1.59-.72,2.57,2.57,0,0,1-.64-1.71,2.54,2.54,0,0,1,.65-1.7ZM74.3,10.48,92.21,27.26H74.3V10.48Z"/></svg>',
	'paste' : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 101.29 122.88"><g><path d="M67.02,12.99c-0.3,0-0.59-0.05-0.86-0.15c-1.42,0-2.58-1.16-2.58-2.58v-5.1h-25.1v5.1c0,1.34-1.02,2.44-2.33,2.57 c-0.28,0.1-0.58,0.16-0.89,0.16h-9.44v10.53h49.56V12.99H67.02L67.02,12.99z M70.57,122.2c-0.46,0.42-1.07,0.68-1.74,0.68 c-0.14,0-0.27-0.01-0.4-0.03l-62.69,0v0.01c-1.56,0-3-0.65-4.05-1.69h0l0-0.01l-0.01,0l-0.01-0.01C0.64,120.11,0,118.68,0,117.12 V20.24c0-1.58,0.65-3.02,1.69-4.06c1.04-1.04,2.48-1.69,4.06-1.69h14.92v-2.82c0-1.05,0.43-2.01,1.13-2.71l0,0l0.01-0.01l0.01-0.01 c0.7-0.69,1.66-1.12,2.71-1.12h8.81V4.27c0-1.17,0.48-2.23,1.25-3.01l0.01-0.01h0C35.36,0.48,36.42,0,37.59,0h26.89 c1.17,0,2.23,0.48,3.01,1.26l0.01-0.01c0.77,0.77,1.25,1.84,1.25,3.02v3.56h7.94c1.05,0,2.01,0.43,2.71,1.13l0.01,0.01l0.01,0.01 l0.01,0.01c0.69,0.7,1.12,1.66,1.12,2.71v2.82h14.92c1.57,0,3.01,0.65,4.05,1.69l0.01-0.01c1.04,1.04,1.69,2.48,1.69,4.06v69.18 c0.05,0.21,0.08,0.42,0.08,0.64c0,0.78-0.34,1.47-0.89,1.95l-29.62,30C70.72,122.08,70.64,122.14,70.57,122.2L70.57,122.2z M66.25,117.71V95.27c0-2.14,0.88-4.09,2.29-5.5c1.41-1.41,3.36-2.29,5.5-2.29h22.01V20.24c0-0.16-0.07-0.3-0.17-0.41l0.01-0.01 l-0.01,0c-0.1-0.1-0.25-0.16-0.41-0.16H80.55v5.17c0,1.05-0.43,2.01-1.13,2.71l-0.01,0l-0.01,0.01l-0.01,0.01 c-0.7,0.69-1.66,1.12-2.71,1.12H24.52c-1.06,0-2.03-0.43-2.72-1.13c-0.08-0.08-0.16-0.17-0.22-0.26c-0.56-0.67-0.91-1.54-0.91-2.47 v-5.17H5.74c-0.16,0-0.3,0.07-0.41,0.17c-0.11,0.11-0.17,0.25-0.17,0.41v96.87c0,0.16,0.06,0.31,0.17,0.41h0l0.01,0.01 c0.1,0.1,0.25,0.17,0.41,0.17v0.01L66.25,117.71L66.25,117.71z M71.41,95.27v18.78l21.14-21.41H74.03c-0.72,0-1.38,0.3-1.85,0.77 C71.7,93.89,71.41,94.55,71.41,95.27L71.41,95.27z M21.27,84.65c-1.43,0-2.58-1.16-2.58-2.58c0-1.43,1.16-2.58,2.58-2.58h45.4 c1.42,0,2.58,1.16,2.58,2.58c0,1.42-1.16,2.58-2.58,2.58H21.27L21.27,84.65z M21.27,50.08c-1.43,0-2.58-1.16-2.58-2.58 c0-1.42,1.16-2.58,2.58-2.58h58.67c1.43,0,2.58,1.16,2.58,2.58c0,1.42-1.16,2.58-2.58,2.58H21.27L21.27,50.08z M21.27,67.36 c-1.43,0-2.58-1.16-2.58-2.58c0-1.42,1.16-2.58,2.58-2.58h58.67c1.43,0,2.58,1.16,2.58,2.58c0,1.43-1.16,2.58-2.58,2.58H21.27 L21.27,67.36z"/></g></svg>',
	'erase' : '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0 -540.36)"><path d="m338.76 578.93 148.26 123.02c12.787 10.611 14.538 29.446 3.9252 42.232l-178.84 215.47c-17.319 15.894-96.448 23.228-117.54 2.9907l-102.59-86.377c-12.711-10.702-14.538-29.446-3.9252-42.232l208.48-251.17c10.613-12.786 29.451-14.538 42.239-3.9271z" style="fill:none;stroke-width:24;stroke:#000"/><rect x=".13773" y="1027.1" width="367.39" height="25.711"/><path d="m344.97 582.49 135.38 115.04c12.647 10.747 14.396 29.763 3.9222 42.638l-103.03 126.65-193.89-140.98 115.88-139.5c10.605-12.767 29.087-14.588 41.733-3.8408z"/></g></svg>',
	'benzene' : '<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1.0097 0 0 1.0097 -460.99 -86.851)" style="stroke-linecap:round;stroke-width:8;stroke:#000"><path d="m485.55 140.47v50.011m-13.614-61.788v73.566m66.909 18.992 43.31-25.005m-46.508 42.796 63.709-36.783m-60.511-92.558 43.31 25.005m-46.508-42.797 63.709 36.783m0 73.566v-73.566m-127.42 73.566 63.71 36.783m0-147.13-63.71 36.783"/></g></svg>',
	'c7' : '<svg style="stroke-linecap:round;stroke:#000" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg"><path d="m79.97 7.7297 59.242 28.529 14.631 64.105-40.996 51.408h-65.753l-40.996-51.408 14.631-64.105z" style="fill:none;stroke-linejoin:round;stroke-width:8"/></svg>',
	'c6' : '<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1.0097 0 0 1.0097 -460.99 -86.851)" style="stroke-linecap:round;stroke-width:8;stroke:#000"><path d="m471.93 128.69v73.566m63.71 36.783 63.709-36.783m-63.709-110.35 63.709 36.783m0 73.566v-73.566m-127.42 73.566 63.71 36.783m0-147.13-63.71 36.783"/></g></svg>',
	'c5' : '<svg style="stroke-linecap:round;stroke:#000" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg"><path d="m5.4276 62.004 74.264-54.031m-45.984 141.63-28.28-87.6m120.25 87.6h-91.968m120.48-87.6-28.51 87.6m-45.984-141.63 74.494 54.031" style="stroke-width:8"/></svg>',
	'triangle' : '<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0 -1016.4)"><path d="m35.814 1042.4v9.802h-9.802z" style="stroke-linecap:round;stroke-linejoin:round;stroke-opacity:.97748;stroke-width:.37089;stroke:#000"/></g></svg>',
};

var scripts = document.getElementsByTagName("script"),
    src = scripts[scripts.length-1].src,
    root_dir = src.substring(0, src.lastIndexOf('/'));
	if (root_dir){
		root_dir += '/';
	}

const FONT_FAMILY = 'arial',
FONT_ATOMS = FONT_SIZE + 'px ' + FONT_FAMILY,
FONT_SUB = FONT_SUB_SIZE + 'px ' + FONT_FAMILY;

var molEditContainer;
var canvas, overlay, hidden;
var ctxo, ctx, ctxh;

var util_cvs = document.createElement('canvas');
var util_ctx = util_cvs.getContext('2d');

const inputEvent = new Event('input');

var horizontalMenu, verticalMenu, overlayMenu, canvasWrapper;


util_ctx.font = FONT_ATOMS;
const TEXT_POS = {H: util_ctx.measureText('H').width}
Object.keys(ELEMENTS_TABLE).forEach( el => {
	TEXT_POS[el] = util_ctx.measureText(el).width/2 + TEXT_POS.H/2;
});

TEXT_POS.sub =  (function() {
	const subs = [0];
	subs[''] = 0;
	util_ctx.font = FONT_SUB;
	for (let i = 1; i < 10; i++){
		subs.push((util_ctx.measureText(i).width/2) + TEXT_POS.H/2);
	}
	util_ctx.font = FONT_ATOMS;
	return subs;
})()


var sceneMol = new Molecule();
var draggingPoint = null;
var draggingMol = new Molecule();
var activePoint = null;
var activeLine = null;
var selected = [];
var selectRect = {};
var activeMode = MODE_DRAW_IDLE;
var mode = activeMode;
// var viewHeight = 0;
var viewWidth = 0;
var devicePixelRatio = window.devicePixelRatio || 1;
// var offsetX, offsetY;
const mousePos = {x: 0, y: 0, noMove: false, mouseOver: false};
var currentAtomType = 'C';
var ct = {btn: {}, toolBtn: {}};  // controls

const history = {
	index: 0,
	snapshots: [new Molecule()],

	makeSnapshot: function() {
		const snapshot = sceneMol.copy();
		if ((history.index+1) < history.snapshots.length){
			history.snapshots.splice(history.index+1);
		}
		history.snapshots.push(snapshot);
		history.index = history.snapshots.length-1;
		ct.btn.undo.enable();
		ct.btn.redo.disable();
		molEditContainer.dispatchEvent(inputEvent);
		console.log('snapshot',history);
	},

	back: function() {
		if (history.index === 0) return;
		history.index -= 1;
		history.loadSnapshot();
		console.log('back', history);
	},

	forward: function() {
		if ((history.index+1) >= history.snapshots.length) return;
		history.index += 1;
		history.loadSnapshot();
		console.log('fwd', history)
	},

	loadSnapshot: function() {
		const snapshot = history.snapshots[history.index];
		sceneMol = snapshot.copy();
		selected = []
		activePoint = null;
		activeLine = null;
		if (history.index != 0){
			ct.btn.undo.enable();
		} else {
			ct.btn.undo.disable();
		}
		if (history.index != history.snapshots.length-1){
			ct.btn.redo.enable();
		} else {
			ct.btn.redo.disable();
		}
		scene.draw();
		ClearScene(ctxo);
		molEditContainer.dispatchEvent(inputEvent);
	},
};

const scene = {
	update : function() {
		sceneMol.render();
		molecularFormula.update();
	},

	draw : function() {
		ClearScene(ctx);
		sceneMol.draw(ctx);
		molecularFormula.update();
		molecularFormula.print();
	},

	atomIsInside : function(at) {
		return at.x > EDITOR_MARGIN &&
				at.x < canvas.width/devicePixelRatio-EDITOR_MARGIN &&
				at.y > EDITOR_MARGIN &&
				at.y < canvas.height/devicePixelRatio-EDITOR_MARGIN;
	},

	bBoxIsInside : function (bbox) {
		return bbox.x1 > EDITOR_MARGIN &&
				bbox.y1 > EDITOR_MARGIN &&
				bbox.x2 < canvas.width/devicePixelRatio-EDITOR_MARGIN &&
				bbox.y2 < canvas.height/devicePixelRatio-EDITOR_MARGIN;
	},
	drawDraggingMol : function () {
		if (mode != MODE_DRAWING) return;
		if (scene.bBoxIsInside(draggingMol.getBBox())){
			draggingMol.draw(ctxo, PASTING_LINE_COLOR);
		} else {
			draggingMol.draw(ctxo, INVALID_COLOR);
		}
	}

};

function BBox(x1,y1,x2,y2){
	this.x1 = Math.min(x1,x2);
	this.x2 = Math.max(x1,x2);
	this.y1 = Math.min(y1,y2);
	this.y2 = Math.max(y1,y2);
	this.cx = (x1+x2)/2;
	this.cy = (y1+y2)/2;
	this.width = this.x2-this.x1;
	this.height = this.y2-this.y1;
};

BBox.prototype.setCenter = function(cx,cy){
	let dx = cx - this.cx;
	let dy = cy - this.cy;
	this.x1 += dx;
	this.x2 += dx;
	this.y1 += dy;
	this.y2 += dy;
	this.cx = cx;
	this.cy = cy;
};

function Molecule() {
	this.atoms = [];
	this.bonds = [];
};

Molecule.prototype.newAtom = function(x,y,type,charge){
	let at = new Atom(x,y,type,charge);
	this.addAtom(at);
	return at;
};

Molecule.prototype.newBond = function(at1,at2,type) {
	let b = new Bond(at1,at2,type);
	at1.bonds.push(b);
	at2.bonds.push(b);
	this.addBond(b);
	return b;
};

Molecule.prototype.addAtom = function(atom){
	this.atoms.push(atom);
};

Molecule.prototype.addBond = function(bond){
	//if (bond.at1 === bond.at2) return;
	this.bonds.push(bond);
};

Molecule.prototype.popAtom = function(atom){


	let i = this.atoms.indexOf(atom);
	if (i === -1) return;
	atom.bonds.forEach(b => {
		let j = this.bonds.indexOf(b)
		if (j !== -1) {
			this.bonds.splice(j, 1)
		}
	});
	this.atoms.splice(i,1);
};

Molecule.prototype.removeAtom = function(atom){
	let i = this.atoms.indexOf(atom);
	if (i === -1) return;
	let temp_bonds =  atom.bonds.slice()
	temp_bonds.forEach(b => this.removeBond(b));
	this.atoms.splice(i,1);
};

Molecule.prototype.removeBond = function(bond){
	let i = this.bonds.indexOf(bond);
	if (i === -1) return;
	this.bonds.splice(i,1);
	[bond.at1, bond.at2].forEach(at => {
		i = at.bonds.indexOf(bond);
		at.bonds.splice(i,1);
	});
};

Molecule.prototype.removeElement = function(el){
	if (el instanceof Atom) {
		return this.removeAtom(el);
	}
	return this.removeBond(el)
};

Molecule.prototype.unify = function(fragment){
	if (fragment instanceof Atom){
		const atom = fragment;
		fragment = new Molecule();
		fragment.addAtom(atom);
		atom.bonds.forEach(b => fragment.addBond(b));
	}

	fragment.atoms.forEach(atF => {
		let target = this.atoms.find(at0 => atF.overlaps(at0));
		if (target){
			atF.bonds.forEach(b => {
				if (b.at1 === atF){
					b.at1 = target;
				} else {
					b.at2 = target;
				}
				target.bonds.push(b);
			});
		} else {
			this.addAtom(atF);
		}
	});

	fragment.bonds.forEach(bond => {
		let target = this.bonds.find(b => {
			return bond.isIdentical(b);
		});
		this.addBond(bond);
		if (target || bond.at1 === bond.at2){
			this.removeBond(bond)
		}
	});
};

Molecule.prototype.render = function() { 
		this.atoms.forEach(at => at.render());
		this.bonds.forEach(b => b.render());
};

Molecule.prototype.draw = function(cx, color) {
	if (color !== undefined){
		cx.strokeStyle = color;
		cx.fillStyle = color;
	} else {
		cx.strokeStyle = LINE_COLOR;
		cx.fillStyle = LINE_COLOR;
	}
	cx.lineWidth = LINE_WIDTH;

	this.bonds.forEach(b => b.draw(cx));
	cx.save();
	cx.translate(0,ATOM_VERTICAL_CENTERING);
	this.atoms.forEach(at => at.draw(cx));
	cx.restore()
	if (!UI_VISIBLE || ct.btn.smiles === null) return;
	if (this.atoms.length != 0){
		ct.btn.smiles.enable();
	} else {
		ct.btn.smiles.disable();
	}
};

Molecule.prototype.copy = function() {
	const newMol = new Molecule();
	this.atoms.forEach(a => {
		let newAtom = a.copy();
		newAtom.bonds = [];
		newMol.addAtom(newAtom);
	});
	this.bonds.forEach(b => newMol.addBond( b.copy() ));
	newMol.bonds.forEach(b => {
		b.at1 = newMol.atoms[this.atoms.indexOf(b.at1)];
		b.at2 = newMol.atoms[this.atoms.indexOf(b.at2)];
		b.at1.bonds.push(b);
		b.at2.bonds.push(b);
	});
	return newMol;
};

Molecule.prototype.dump = function() {
	const atoms = [];
	const bonds = [];
	this.atoms.forEach( at => {
		atoms.push({x: Math.round(at.x),
					y: Math.round(at.y),
					type: at.type, 
					charge: at.charge
				});
	});
	this.bonds.forEach( b => {
		bonds.push({at1: this.atoms.indexOf(b.at1),
					at2: this.atoms.indexOf(b.at2),
					type: b.type
				});
	});

	let json = JSON.stringify({atoms:atoms, bonds: bonds});
	return json
};

Molecule.prototype.parse = function(str) {
	if (!str) return;
	this.atoms = [];
	this.bonds = [];
	let mol;
	if (typeof str === 'object'){
		mol = str;
	} else {
		mol = JSON.parse(str);
	}
	mol.atoms.forEach( at => {
		this.newAtom(at.x, at.y, at.type, at.charge);
	});
	mol.bonds.forEach( b => {
		const at1 = this.atoms[b.at1]
		const at2 = this.atoms[b.at2]
		if (at1 === undefined || at2 === undefined) {
			console.log('Parsing error');
		} else {
			this.newBond(at1, at2, b.type);
		}
	});
};

Molecule.prototype.getBBox = function() {
	let x2 = this.atoms.reduce((m, at) => Math.max(m,at.x), 0);
	let y2 = this.atoms.reduce((m, at) => Math.max(m,at.y), 0);
	let x1 = this.atoms.reduce((m, at) => Math.min(m,at.x), x2);
	let y1 = this.atoms.reduce((m, at) => Math.min(m,at.y), y2);
	return new BBox(x1,y1,x2,y2);
};

Molecule.prototype.getBBoxText = function() {
	let x2 = this.atoms.reduce((m, at) => Math.max(m,at.x+Math.max(0,at.labelLen)+FONT_SIZE), 0);
	let y2 = this.atoms.reduce((m, at) => Math.max(m,at.y+FONT_SIZE), 0);
	let x1 = this.atoms.reduce((m, at) => Math.min(m,at.x+Math.min(0,at.labelLen)-FONT_SIZE), x2);
	let y1 = this.atoms.reduce((m, at) => Math.min(m,at.y-FONT_SIZE), y2);
	return new BBox(x1,y1,x2,y2);
};

function Atom(x,y,type,charge){
	//this.mol = mol;
	this.x = x;
	this.y = y;
	this.type = type;
	this.bonds = [];
	this.charge = 0;
	if (charge !== undefined) {
		this.charge = charge;
	}
};

Atom.prototype.render = function() {
	const TOP = 0, BOTTOM = 1, LEFT = 2, RIGHT = 3;
	const COLLINEAR_TOL = 0.17; //in rad (0.17 == approx. 10deg)
	let that = this
	function SetPos(pos){
		switch (pos){
			case TOP:
				if (that.hCount > 1 || that.charge != 0){
					SetPos(RIGHT);
					break;
				}
				that.labelHPosY = that.y + FONT_SIZE;
				break;
			case BOTTOM:
				if (that.hCount > 1 || that.charge != 0){
					SetPos(RIGHT);
					break;
				}
				that.labelHPosY = that.y - FONT_SIZE;
				break;
			case LEFT:
				that.labelHPosX = that.x - TEXT_POS[that.type];
				that.labelLen = -TEXT_POS[that.type]
				if (that.hSubscript != ''){
					that.labelHPosX -= TEXT_POS.sub[that.hSubscript];
					that.labelLen -= TEXT_POS.sub[that.hSubscript];
				}
				break;
			case RIGHT:
				that.labelHPosX = that.x + TEXT_POS[that.type];
				that.chargeLabelPosX += TEXT_POS.H;
				that.labelLen = TEXT_POS[that.type] + TEXT_POS.sub[that.hSubscript];
				break;
		}
	}
	let bondCount = this.bonds.reduce((sum, b) => sum+b.type, 0);
	this.label = this.type;
	this.labelLen = 0;
	let valency = ELEMENTS_TABLE[this.type].valency;
	

	this.hCount = valency[0] + this.charge;
	if (this.hCount > 4) {
		this.hCount = 8 - this.hCount;
	}
	this.hCount -= bondCount;
	if ((this.hCount < 0) && (this.charge === 0) && valency.includes(bondCount)){
		this.hCount = 0;
	}

	this.labelHPosX = this.x;
	this.labelHPosY = this.y;
	this.chargeLabel = '';
	this.chargeLabelPosX = this.x + TEXT_POS[this.type] - TEXT_POS.H + TEXT_POS.sub['1'];
	if (this.charge !== 0) {
		if (this.charge > 0) {
			this.chargeLabel = '+';
		} else {
			this.chargeLabel = '–';
		}
		let c = Math.abs(this.charge);
		if (c > 1) {
			this.chargeLabel = c+''+this.chargeLabel;
			this.chargeLabelPosX += TEXT_POS.sub[c] - TEXT_POS.H/2
		}
	}

	if (this.type === 'C' && this.charge === 0){
		this.label = '';
		if (this.bonds.length === 0) {
			this.label = 'C';
		} else if (this.hCount < 0) {
			this.label = 'C';
			return;
		} else if (this.bonds.length === 1) {
			if  (this.bonds[0].at1.bonds.length === 1 && 
				this.bonds[0].at2.bonds.length === 1) {
				this.label = 'C';
			} else {
				return;
			}
		} else if ((this.bonds.length === 2 ) && 
					(this.bonds[0].type === this.bonds[1].type)) {
			let adj = this.getAdjacent();
			let angleDiff = adj[0].angleToAtom(this) - this.angleToAtom(adj[1])
			if (Math.abs(angleDiff) < COLLINEAR_TOL 
				|| (2*Math.PI) - Math.abs(angleDiff) < COLLINEAR_TOL) { 								// if collinear
				this.label = 'C';
			} else {
				return;
			}
		} else {
			return;
		}
	}
	this.hSubscript = this.hCount;
	if (this.hCount < 2) this.hSubscript = '';
	if (this.hCount <= 0){
		//SetPos(RIGHT);
		return;
	}

	if (this.bonds.length === 0) {
		SetPos(RIGHT);

	} else if (this.bonds.length === 1){
		if (this.getAdjacent(this.bonds[0]).x > this.x + NUM_TOL){
			SetPos(LEFT);
		} else {
			SetPos(RIGHT);
		}

	} else if (this.bonds.length > 1){
		let otherAtoms = this.getAdjacent();
		if (otherAtoms.every(at => at.x < this.x + NUM_TOL)){
			SetPos(RIGHT);
		} else if (otherAtoms.every(at => at.x > this.x - NUM_TOL)){
			SetPos(LEFT);
		} else if (otherAtoms.every(at => at.y > this.y - NUM_TOL)){
			SetPos(BOTTOM);
		} else if (otherAtoms.every(at => at.y < this.y + NUM_TOL)){
			SetPos(TOP);
		} else {
			const angles = [];
			const ALLOWED_ANGLE = 46
			const n = this.getAdjacent();
			n.forEach(at => angles.push(this.angleToAtom(at)/Math.PI*180));
			if (angles.every(a => a < 360-ALLOWED_ANGLE && a > ALLOWED_ANGLE)){
				SetPos(RIGHT);
			} else if (angles.every(a => a < 180-ALLOWED_ANGLE || a > 180+ALLOWED_ANGLE)){
				SetPos(LEFT);
			} else if (angles.every(a => a < 90-ALLOWED_ANGLE || a > 90+ALLOWED_ANGLE)){
				SetPos(TOP);
			} else if (angles.every(a => a < 270-ALLOWED_ANGLE || a > 270+ALLOWED_ANGLE)){
				SetPos(BOTTOM);
			} else {
				SetPos(RIGHT);
			}
		}
	}
};

Atom.prototype.draw = function(cx) {
	if (this.label == ''){
		return;
	}
	if (this.hCount < 0){
		cx.save();
		cx.fillStyle = INVALID_COLOR;
	}

	cx.fillText(this.label, this.x, this.y);
	if (this.hCount > 0){

		cx.fillText('H', this.labelHPosX , this.labelHPosY)
		cx.font = FONT_SUB;
		cx.fillText(
			this.hSubscript, this.labelHPosX + TEXT_POS.sub[this.hSubscript],
			this.labelHPosY + FONT_SUB_OFFSET_Y);
		cx.font = FONT_ATOMS;
	}
	if (this.charge !== 0){
		cx.font = FONT_SUB;
		cx.fillText(
			this.chargeLabel, this.chargeLabelPosX,
			this.y - FONT_SUP_OFFSET_Y);
		cx.font = FONT_ATOMS;
	}
	if (this.hCount < 0){
		cx.restore();
	}
};

Atom.prototype.getAdjacent = function(bond){
	if (bond === undefined){
		let adj = [];
		this.bonds.forEach( b => {
			if (b.at1 === this){
				adj.push(b.at2);
			} else {
				adj.push(b.at1);
			}
		});
		return adj;
	} else {
		if (bond.at1 === this) return bond.at2;
		return  bond.at1;
	}
};

Atom.prototype.overlaps = function(atom){
	return (atom.x-this.x)**2 + (atom.y-this.y)**2 < MERGE_TOL**2;
};

Atom.prototype.angleToAtom = function(atom){
	let dX = atom.x - this.x;
	let dY = atom.y - this.y;
	let angle = Math.atan2(dY,dX);
	angle = (2*Math.PI+angle)%(2*Math.PI); //0-2pi conversion
	return angle;	// radians
};

Atom.prototype.copy = function(){ 
	const cAtom = new Atom();
	Object.assign(cAtom, this);
	return cAtom;
};

Atom.prototype.clone = function(target){ 
	Object.assign(target, this);
};

function Bond(at1,at2,type){
	//this.mol = mol;
	this.at1 = at1;
	this.at2 = at2;
	this.type = type;
	this.lines = [];
};

Bond.prototype.render = function(){

	function RenderSingleBond(bond){
		let bondLine = BondToLine(bond);
		bond.lines =[bondLine]
		TrimBondForText(bond)
	}

	function RenderTripleBond(bond){
		let bondLine = BondToLine(bond);
		bond.lines = ParallelLines(bondLine, TRIPLE_BOND_SPREAD);
		bond.lines.push(bondLine);
		TrimBondForText(bond);
	}

	function RenderDoubleBond(bond){
	
		function GetSubsOrientations(atom, bond){
			let subAtoms = atom.getAdjacent();
			let i = subAtoms.indexOf(bond.at1)
			if (i === -1) i = subAtoms.indexOf(bond.at2);
			subAtoms.splice(i, 1);
			let orient = {L: 0, R: 0, C: 0, T: 0};
			subAtoms.forEach( sub => {
				let side = WhichSideIsAtom(bond, sub);
				if (side > NUM_TOL){
					orient.L += 1;
				} else if (side < -NUM_TOL){
					orient.R +=1;
				} else {
					orient.C +=1;
				}
			});
			orient.T = orient.L + orient.R + orient.C
			return orient;
		}
	
		let bondLine = BondToLine(bond);
		let orientA = GetSubsOrientations(bond.at1, bond)
		let orientB = GetSubsOrientations(bond.at2, bond)
		let doubleLine = ParallelLines(bondLine, 2*DOUBLE_BOND_SPREAD);
		let lineL = doubleLine[0];	
		let lineR = doubleLine[1];
		let toBeTrimmed = true;
	
		bond.lines = [bondLine];
		let centerX = (lineL.p1.x + lineL.p2.x)/2;
		let centerY = (lineL.p1.y + lineL.p2.y)/2;
		let ring = bond.isInRing();
		if (ring){
			util_ctx.beginPath();
			util_ctx.moveTo(ring[0].x , ring[0].y);
			ring.forEach( at => util_ctx.lineTo(at.x, at.y));
			if (util_ctx.isPointInPath(centerX, centerY)){
				bond.lines.push(lineL);
			} else {
				bond.lines.push(lineR);
			}
		} else if ((orientA.T) > 2 || (orientB.T) > 2){  // more than 2 other substituents
			bond.lines = ParallelLines(bondLine, DOUBLE_BOND_SPREAD);
			toBeTrimmed = false;
		} else if ((orientA.L + orientB.L) > (orientA.R + orientB.R)){
			bond.lines.push(lineL);
		} else if ((orientA.L + orientB.L) < (orientA.R + orientB.R)){
			bond.lines.push(lineR);
		} else if ((orientA.T) == 0 || (orientB.T) == 0){
			bond.lines = ParallelLines(bondLine, DOUBLE_BOND_SPREAD);
			toBeTrimmed = false;
		} else {
			bond.lines.push(lineL);
		}
		TrimBondForText(bond)
		if (!toBeTrimmed) return;
		if ((orientA.T) != 0 && bond.at1.label == '') {
			bond.lines[1].p1 = TrimLineEnd(bond.lines[1].p2, bond.lines[1].p1, DBOND_TRIM)
		}
		if ((orientB.T) != 0 && bond.at2.label == ''){
			bond.lines[1].p2 = TrimLineEnd(bond.lines[1].p1, bond.lines[1].p2, DBOND_TRIM)
		}
	}

	switch (this.type){
		case 1:
			RenderSingleBond(this);
			break;
		case 2:
			RenderDoubleBond(this);
			break;
		case 3:
			RenderTripleBond(this);
			break;
	}
};

Bond.prototype.draw = function(cx){
	this.lines.forEach(l => DrawLine(cx,l));
};

Bond.prototype.isIdentical = function(bond){
	return ((this.at1 === bond.at1 && this.at2 === bond.at2) || 
		(this.at1 === bond.at2 && this.at2 === bond.at1));
};

Bond.prototype.isInRing = function (){
	function Util(at){
		if (at === thisBond.at2) {
			path.push(at)
			return true;
		}
		if (visited.indexOf(at) != -1) return false;
		visited.push(at);
		let others = at.getAdjacent();
		if (others.some(a => Util(a))){
			path.push(at)
			return true
		}
		return false
	}
	const thisBond = this
	const visited = [this.at1];
	const path = [this.at1];
	const neigh = this.at1.getAdjacent();
	neigh.splice(neigh.indexOf(this.at2), 1);
	let i = 0;
	let n;
	while (n = neigh[i++]){
		visited.push(n);
		if (n.getAdjacent().some(a => (a != this.at1) ? Util(a) : false)){
			path.push(n)
			return path
		}
	}
	return false
};

Bond.prototype.copy = function(){ 
	const cBond = new Bond();
	Object.assign(cBond, this);
	cBond.lines = [];
	this.lines.forEach( l => {
		cBond.lines.push(Object.assign({}, l));
	});
	return cBond;
};

function Button(parent, text, svgIcon, title, callback, noHighlight){
	this.node = document.createElement('button');
	this.node.tabIndex=-1
	if (text) this.node.textContent = text;
	if (svgIcon) {
		this.node.innerHTML = '<div draggable="false" class="moldraw-btnIcon">' + svgIcon + '</div>';
	}
	parent.appendChild(this.node);
	this.callback = () => {
			horizontalMenu.classList.add('hidden');
			if (Object.values(ct.toolBtn).includes(this)) {  // if button is tool
				ct.btn.drawCollapsed.changeActive(this);
			}
			callback(); 
			if (!noHighlight){
				this.active();
			}
		};
	this.node.addEventListener('click', this.callback);
	if (title != null){
		this.node.title = title
	}
	this.disable();
	//return this;
};

Button.prototype.enable = function() {
	this.node.className = 'moldraw-ct-enabled';
};

Button.prototype.disable = function() {
	this.node.className = 'moldraw-ct-disabled';
};

Button.prototype.active = function() {
	this.node.className = 'moldraw-ct-active';
};

Button.prototype.changeActive = function(activeBtn) {
	while (this.node.childNodes.length > 1){
		this.node.removeChild(this.node.lastChild);
	}
	this.node.appendChild(activeBtn.node.firstChild.cloneNode(true));
}

const clipboard = {
	mol: null,

	copy: function() {
		let molCp = new Molecule();
		selected.forEach( element => {
			if (element instanceof Atom) {
				molCp.addAtom(element);
			} else {
				molCp.addBond(element);
			}
		}); 
		// atoms for bonds
		molCp.bonds.forEach( b => {
			[b.at1,b.at2].forEach( at => {
				if (molCp.atoms.indexOf(at) === -1)	molCp.addAtom(at);
			});
		});
		clipboard.mol = molCp.copy();
		if (!clipboard.isEmpty()) {
			ct.btn.paste.enable();
		}
		// center to 0,0
		activeLine = [];
		activePoint = [];
		ClearScene(ctxo);
		Highlight();
	},

	paste: function() {
		if (clipboard.isEmpty()) return;
		let bbox = clipboard.mol.getBBox();
		placePreview.init(clipboard.mol, bbox.cx, bbox.cy);
	},

	isEmpty: function() {
		if (!clipboard.mol) return true;
		return (clipboard.mol.atoms.length === 0);
	},
};

const placePreview = {
	mol: null,
	centerX: null,
	centerY: null,
	posX: null,
	posY: null,
	angle: 0,
	bbox: null,
	valid: true,

	init: function(fragment, centerX, centerY) {
		if (mode === MODE_PASTING) ChangeMode(activeMode); // reset pasting and proceed
		mode = MODE_PASTING;
		selected = [];
		ClearScene(ctxo);
		this.mol = fragment.copy();
		this.mol.render();
		this.snapToElement = function(){};
		this.bbox = this.mol.getBBox();
		this.centerX = centerX;
		this.centerY = centerY;
		this.posX = 0;
		this.posY = 0;
		this.redrawFragment();
		this.move(canvas.width/2/devicePixelRatio, canvas.height/2/devicePixelRatio);
	},
	move: function(newX, newY, relative) {
		if (mode != MODE_PASTING) return;
		if (relative) {
			this.posX += newX;
			this.posY += newY;
		} else {
			this.posX = newX;
			this.posY = newY;
		}
		this.angle = 0;
		this.snapToElement();
		this.bbox.setCenter(this.posX,this.posY);
		this.draw();
	},

	draw: function() {
		if (mode != MODE_PASTING) return;
		this.valid = scene.bBoxIsInside(this.bbox);
		ctxo.save();
		ctxo.translate(this.posX, this.posY);
		ctxo.rotate(this.angle);
		ctxo.translate(-this.centerX, -this.centerY);
		ctxo.scale(1/devicePixelRatio,1/devicePixelRatio);
		if (!this.valid){
			ctxo.fillStyle = INVALID_COLOR;
			ctxo.fillRect(0,0,canvas.width,canvas.height)
			ctxo.globalCompositeOperation = 'destination-in';
		}
		ctxo.drawImage(hidden,0,0);
		ctxo.restore();
	},

	place: function() {
		if (this.mol === null) return;
		if (!this.valid) {
			this.draw();
			return;
		}
		this.mol.atoms.forEach(at => {
			at.x -= this.centerX;
			at.y -= this.centerY;			
			let x = at.x*Math.cos(this.angle)-at.y*Math.sin(this.angle);
			let y = at.y*Math.cos(this.angle)+at.x*Math.sin(this.angle);
			at.x = x + this.posX;
			at.y = y + this.posY;
		});
		sceneMol.unify(this.mol);
		scene.update();
		scene.draw();
		ChangeMode(activeMode);
		history.makeSnapshot();
	},
	redrawFragment: function() {
		ClearScene(ctxh);
		if (this.mol === null) return;
		this.mol.draw(ctxh,PASTING_LINE_COLOR)
	},
	snapToElement: function() {},
	
	remove: function() {
		this.mol = null;
	},
};

const drawPreview = {
	snapAtomTemp : null,
	snapAtom : null,
	draggingPointTemp : null,

	snapAtomSave: function(){
		this.snapAtomTemp = activePoint.copy();
		this.snapAtom = activePoint;
	},

	snapAtomRestore: function(){
		if (this.snapAtomTemp === null) return;
		this.snapAtomTemp.clone(this.snapAtom);
		this.snapAtomTemp = null;
	},

	draggingPointSave: function(){
		this.draggingPointTemp = draggingPoint.copy();
	},

	draggingPointRestore: function(){
		if (this.draggingPointTemp === null || draggingPoint === null) return;
		this.draggingPointTemp.clone(draggingPoint);
		this.draggingPointTemp = null;
	},

	clear: function(){
		this.snapAtomTemp = null;
		this.snapAtom = null;
		this.draggingPointTemp = null;
	}
};

const FRAGMENTS = {

	benzene: (function(){
		const ring = createRing(6);
		for (let i=0; i<ring.bonds.length; i+=2){
			ring.bonds[i].type = 2;
		}
		return ring;
	})(),

	cyclohexane: createRing(6),
	cyclopentane: createRing(5),
	cycloheptane: createRing(7),
};

const molecularFormula = {
	ct : null,
	fontSize : 16,
	fontSubSize : 12,
	spacing : 2,
	fontSubOffset: 5,
	formula : {'C' : 0, 'H' : 0},

	update : function() {
		this.formula = {'C' : 0, 'H' : 0};
		let count;
		sceneMol.atoms.forEach(at => {
			this.formula['H'] += Math.max(at.hCount, 0); // hCount can be < 0
			count = this.formula[at.type]
			if (count === undefined) {
				this.formula[at.type] = 1;
			} else {
				this.formula[at.type] += 1;
			}
		});
	},
	
	print : function() {
		let posX = canvas.width/devicePixelRatio*0 + 10;
		let posY = canvas.height/devicePixelRatio-10;
		this.ct.save();
		this.ct.textAlign = 'left';
		let symbols = Object.keys(this.formula).sort();
		symbols.splice(symbols.indexOf('C'), 1);
		symbols.splice(symbols.indexOf('H'), 1);
		symbols.splice(0, 0, 'C', 'H');

		let label = 'Formula: ';
		this.ct.font = this.fontSize + 'px ' + FONT_FAMILY;
		this.ct.fillText(label,posX, posY);
		posX += this.ct.measureText(label).width;

		symbols.forEach(symbol => {
			posX = this.printElement(posX, posY, symbol, this.formula[symbol]);
		});
		this.ct.restore();
	},

	printElement : function(x, y, element, count) {
		x = x+this.spacing;
		if (count === 0) return x;
		this.ct.font = this.fontSize + 'px ' + FONT_FAMILY;
		this.ct.fillText(element,x, y);
		let dx = this.ct.measureText(element).width;

		if (count === 1) return x+dx;
		this.ct.font = this.fontSubSize + 'px ' + FONT_FAMILY;
		this.ct.fillText(count, x+dx, y+this.fontSubOffset);
		let dx2 = this.ct.measureText(count).width;

		return x+dx+dx2;
	},
};



//init();


function resizeCanvas(){
	let bbox = sceneMol.getBBox();
	canvasWrapper.style.height = Math.max(verticalMenu.clientHeight,bbox.y2+EDITOR_MARGIN,canvasWrapper.offsetWidth/2)+'px';
	let w = canvas.offsetWidth;
	let h = canvas.offsetHeight;
	let menuIsCollapsed = horizontalMenu.classList.contains('moldraw-overlay');

	h = Math.max(h,bbox.y2+EDITOR_MARGIN);
	canvas.style.minHeight = bbox.y2+EDITOR_MARGIN+'px';
	canvasWrapper.style.minHeight = verticalMenu.clientHeight+'px';
	devicePixelRatio = window.devicePixelRatio || 1;
	let diff = bbox.x2+EDITOR_MARGIN-w;
	if (diff > 0){
		diff = Math.min(diff, bbox.x1-EDITOR_MARGIN);
		sceneMol.atoms.forEach((at) => at.x -= diff);
		sceneMol.render();
	} 

	[canvas, overlay, hidden].forEach ( cvs => {
		cvs.width = Math.floor(w*devicePixelRatio);
		cvs.height = Math.floor(h*devicePixelRatio);
	});

	[ctx, ctxo, ctxh].forEach( cx => initContext(cx));
	if (w < smallScreen && ! menuIsCollapsed){
		collapseHozizontalMenu();
	} else if (w >= smallScreen && menuIsCollapsed){
		expandHozizontalMenu();
	}
	// offsetX = canvas.getBoundingClientRect().left+window.scrollX
	// offsetY = canvas.getBoundingClientRect().top+window.scrollY
};

function collapseHozizontalMenu(){
	horizontalMenu.classList.add('hidden');
	horizontalMenu.classList.add('moldraw-overlay');
	ct.btn.drawCollapsed.node.style.display = 'flex';
	ct.btn.draw.node.style.display = 'none';
	canvasWrapper.insertBefore(horizontalMenu,canvas);	
}

function expandHozizontalMenu(){
	horizontalMenu.classList.remove('moldraw-overlay');
	horizontalMenu.classList.remove('hidden');
	ct.btn.drawCollapsed.node.style.display = 'none';
	ct.btn.draw.node.style.display = 'flex';
	canvasWrapper.parentNode.insertBefore(horizontalMenu,canvasWrapper);
}

function initUI(mainDiv){
	UI_VISIBLE = true;
	const NO_ACTIVE = true;
	molEditContainer = mainDiv ? mainDiv : document.getElementById('molEdit');

	if (document.body.classList.contains('dark-theme')){
		setColorScheme('dark');
	} else {
		setColorScheme('light');
	}

	canvas = document.createElement('canvas');
	overlay = document.createElement('canvas');
	hidden = document.createElement('canvas');
	ctxo = canvas.getContext('2d');
	ctx = overlay.getContext('2d');
	ctxh = hidden.getContext('2d');

	if (typeof molEditContainer === 'undefined') {
		molEditContainer = overlay;
	}

	overlay.addEventListener('mousedown', OnMouseClick);
	overlay.addEventListener('mouseup', OnMouseUp);
	overlay.addEventListener('mousemove', OnMouseMove);
	overlay.addEventListener('touchstart', OnTouchStart,{passive: false});
	overlay.addEventListener('touchend', OnTouchEnd,{passive: false});
	overlay.addEventListener('touchmove', OnTouchMove,{passive: false});
	molEditContainer.addEventListener('mouseover', ()=>mousePos.mouseOver=true);
	molEditContainer.addEventListener('mouseout', () => mousePos.mouseOver=false);
	document.addEventListener('keydown', OnKeyPress);

	horizontalMenu = document.createElement('div');
	horizontalMenu.id = 'moldraw-horizontalMenu';
	horizontalMenu.className = 'moldraw-ctrl';
	verticalMenu = document.createElement('div');
	verticalMenu.id = 'moldraw-verticalMenu';
	verticalMenu.className = 'moldraw-ctrl';
	overlayMenu = document.createElement('div');
	overlayMenu.id = 'moldraw-overlayMenu';
	overlayMenu.className = 'moldraw-ctrl';
	canvasWrapper = document.createElement('div');
	canvasWrapper.id = 'moldraw-canvasWrapper';
	canvas.id = 'moldraw-canvas';
	overlay.id = 'moldraw-overlay';

	// offsetX = canvas.getBoundingClientRect().left;
	// offsetY = canvas.getBoundingClientRect().top;

	var menu;


	canvasWrapper.appendChild(overlay);
	canvasWrapper.appendChild(overlayMenu);
	canvasWrapper.appendChild(canvas);

	let rightDiv = document.createElement('div');
	rightDiv.classList.add('moldraw-wrapper');

	rightDiv.appendChild(horizontalMenu);
	molEditContainer.appendChild(verticalMenu);
	rightDiv.appendChild(canvasWrapper);
	molEditContainer.appendChild(rightDiv);
	menu = horizontalMenu;
	menu = verticalMenu;


	ct.btn.draw = new Button( menu, '', ICONS.pencil, 'Draw', () => ChangeMode(MODE_DRAW_IDLE));

	ct.btn.drawCollapsed = new Button( menu, '', ICONS.triangle, 'Draw', () => {ChangeMode(MODE_DRAW_IDLE);
																				horizontalMenu.classList.remove('hidden');
																				});
	ct.btn.drawCollapsed.node.style.display = 'none';
	ct.btn.drawCollapsed.node.firstChild.classList.add('moldraw-btn-expand');
	ct.btn.select = new Button( menu, '', ICONS.select, 'Select', () => ChangeMode(MODE_IDLE));
	ct.btn.erase = new Button( menu, '', ICONS.erase, 'Erase', () => {DeleteSelected(); ChangeMode(MODE_ERASER)});
	ct.btn.undo = new Button( menu, '', ICONS.undo, 'Undo',history.back, NO_ACTIVE);
	ct.btn.redo = new Button( menu, '', ICONS.redo, 'Redo', history.forward, NO_ACTIVE);
	ct.btn.cut = new Button( menu, '', ICONS.cut, 'Cut', CutSelected, NO_ACTIVE);
	ct.btn.copy = new Button( menu, '', ICONS.copy, 'Copy', clipboard.copy, NO_ACTIVE);
	ct.btn.paste = new Button( menu, '', ICONS.paste, 'Paste', clipboard.paste, NO_ACTIVE);
	// ct.btn.delete = new Button( menu, '', 'trash-can.svg', 'Delete', DeleteSelected, NO_ACTIVE);
	//ct.btn.smiles = new Button( menu, '', 'cell-molecule.svg', 'SMILES', showSMILES, NO_ACTIVE);
	ct.btn.smiles = null;
	// ct.btn.import = new Button( menu, '', 'cell-molecule.svg', 'Import', importMolecule, NO_ACTIVE);
	ct.btn.draw.enable();
	ct.btn.drawCollapsed.enable();
	ct.btn.select.enable();
	ct.btn.erase.enable();

	molecularFormula.ct = ctx

	menu = horizontalMenu;

	Object.keys(ELEMENTS_TABLE).forEach(at => {
		ct.toolBtn[at] = new Button( menu, at, '', ELEMENTS_TABLE[at].name, () => ChangeMode(MODE_DRAW_IDLE, at));
		ct.toolBtn[at].enable();
	});

	ct.toolBtn['_charge_plus'] = new Button( menu, '+', '', 'Add charge +',
		() => {ChangeMode(MODE_DRAW_CHARGE_PLUS);});
	ct.toolBtn['_charge_plus'].enable();

	ct.toolBtn['_charge_minus'] = new Button( menu, '–', '', 'Add charge –',
		() => {ChangeMode(MODE_DRAW_CHARGE_MINUS);});
	ct.toolBtn['_charge_minus'].enable();

	ct.toolBtn['benzene'] = new Button( menu, '', ICONS.benzene, 'Benzene', 
		() => InsertFragment(FRAGMENTS.benzene));
	ct.toolBtn['benzene'].enable();

	ct.toolBtn['ring5'] = new Button( menu, '', ICONS.c5, 'Cyclopentane',
		() => InsertFragment(FRAGMENTS.cyclopentane));
	ct.toolBtn['ring5'].enable();
	
	ct.toolBtn['ring6'] = new Button( menu, '', ICONS.c6, 'Cyclohexane',
		() => InsertFragment(FRAGMENTS.cyclohexane));
	ct.toolBtn['ring6'].enable();

	ct.toolBtn['ring7'] = new Button( menu, '', ICONS.c7, 'Cycloheptane',
		() => InsertFragment(FRAGMENTS.cycloheptane));
	ct.toolBtn['ring7'].enable();

	resizeCanvas();

	window.onload = () => {
		resizeCanvas();
		viewWidth = window.innerWidth;
		// viewHeight = window.innerHeight;
		scene.draw();
	};

	window.onresize = () => {
		// viewHeight = window.innerHeight;
		if (window.innerWidth === viewWidth) return;
		viewWidth = window.innerWidth;
		resizeCanvas();
		scene.draw();
		Highlight();
		scene.drawDraggingMol();
		placePreview.redrawFragment();
		placePreview.draw();
	};

	ChangeMode(MODE_DRAW_IDLE);

};

function InsertFragment(fragment){
	activeMode=MODE_DRAW_IDLE;
	ChangeMode(MODE_DRAW_FRAGMENT);
	fragment.render();
	const atomCount = fragment.atoms.length
	const cx = fragment.atoms.reduce( (acc,at) => at.x+acc,0 )/atomCount;
	const cy = fragment.atoms.reduce( (acc,at) => at.y+acc,0 )/atomCount;
	placePreview.init(fragment, cx, cy);
	placePreview.snapToElement = function(){
		if (this.mol.atoms.length === atomCount+1) {
			this.mol.removeAtom(this.mol.atoms[atomCount]);
		}
		const atom = activePoint;
		const bond = activeLine;
		const centerToSide = Math.sqrt(
			((fragment.bonds[0].at1.x + fragment.bonds[0].at2.x)/2-cx)**2+
			((fragment.bonds[0].at1.y + fragment.bonds[0].at2.y)/2-cy)**2);
		const centerToAtom = Math.sqrt(
							(fragment.atoms[0].x-cx)**2 + 
							(fragment.atoms[0].y-cy)**2);
		if (atom !== null){
			let bondCount = atom.bonds.length;
			if (bondCount === 0){
			// no snap

			} else if (bondCount === 1){
				let at2 = atom.getAdjacent()[0];
				let dx = atom.x - at2.x;
				let dy = atom.y - at2.y;
				let r = centerToAtom / Math.sqrt(dx**2 + dy**2);
				this.posX = atom.x + dx*r;
				this.posY = atom.y + dy*r;
				let angle = Math.atan2(dy,dx);
				//angle = (2*Math.PI+angle)%(2*Math.PI); //0-360 conversion
				this.angle = angle - (90*Math.PI/180)

			} else if (bondCount > 1) {
				const angles = [];
				const pointerAngle = atom.angleToAtom(mousePos)
				let n = atom.getAdjacent();
				n.forEach(at => angles.push(atom.angleToAtom(at)));
				angles.sort((a,b) => a-b);
				angles.push(2*Math.PI+angles[0])
				for (let i=0; i<bondCount+1; i++){
					if ( angles[i] > pointerAngle )
					{
						let dif = angles[i] - angles[ (i-1+bondCount)%bondCount ];
						dif = (2*Math.PI+dif) % (2*Math.PI);
						this.angle = angles[i] - dif/2;
						break;
					}
				}
				this.posX = atom.x + (LINE_LENGTH+centerToAtom)*Math.cos(this.angle);
				this.posY = atom.y + (LINE_LENGTH+centerToAtom)*Math.sin(this.angle);
				this.angle = this.angle - (90*Math.PI/180);
				let at0 = this.mol.atoms[0];
				let newAt = this.mol.newAtom(at0.x, at0.y-LINE_LENGTH, atom.type);
				let newBond = this.mol.newBond(newAt, at0, 1);
				newAt.render();
				newBond.render();
				newAt.label = '';
			}
		}
		if (bond !== null){
			let angle = bond.at1.angleToAtom(bond.at2);
			const snapBondCenterX = (bond.at1.x + bond.at2.x)/2;
			const snapBondCenterY = (bond.at1.y + bond.at2.y)/2;
			let dx = bond.at2.x - bond.at1.x;
			let dy = bond.at2.y - bond.at1.y;
			let r = centerToSide/Math.sqrt(dx**2+dy**2);
			let a = fragment.bonds[0].at1.angleToAtom(fragment.bonds[0].at2)
			if (dx*(mousePos.y - bond.at1.y) < dy*(mousePos.x - bond.at1.x)) {
				dy = -dy;
				dx = -dx;
				a -= Math.PI;
			}
			this.posX = snapBondCenterX - r*dy;
			this.posY = snapBondCenterY + r*dx;
			this.angle = angle-a;

		}
		this.redrawFragment();
	}
};

function CutSelected() {
	clipboard.copy();
	DeleteSelected();
};

function SelectAll() {
	ChangeMode(MODE_IDLE);
	sceneMol.atoms.forEach(at => selected.push(at));
	sceneMol.bonds.forEach(b=> selected.push(b));
	Highlight();
};

function ShortenLine(p1X, p1Y, p2X, p2Y) {
	let dX = p2X-p1X;
	let dY = p2Y-p1Y;
	let len = Math.sqrt(dX**2 + dY**2);
	let ratio = LINE_LENGTH/len;
	return {x: p1X+dX*ratio, y: p1Y+dY*ratio};
};

function LineSnapAngle(p1X, p1Y, p2X, p2Y){
	let dX = p2X-p1X;
	let dY = p2Y-p1Y;
	let angle = Math.atan2(-dY,dX);
	angle = (2*Math.PI+angle)%(2*Math.PI);
	let step = SNAP_ANGLE_STEP*Math.PI/180;
	let rot = (angle+step/2) % step - step/2;
	let x = p1X + dX*Math.cos(rot) - dY*Math.sin(rot);
	let y = p1Y + dY*Math.cos(rot) + dX*Math.sin(rot);
	return {x: x, y: y};
};

function TrimBondForText(bond){
	function trimEnd(at,p1,p2){
		if (at.labelLen > 0){
			let xMax = TRIM_SIZE + at.labelLen
			return TrimLineEndY(p1, p2, TRIM_SIZE, xMax)
		} else if (at.labelLen < 0){
			let xMax = TRIM_SIZE - at.labelLen
			return TrimLineEndY(p1, p2, TRIM_SIZE, -xMax)
		}
		return TrimLineEnd(p1, p2, TRIM_SIZE)
	}

	bond.lines.forEach(function(l){
		if (bond.at1.label != ''){
			l.p1 = trimEnd(bond.at1, l.p2, l.p1)
		}
		if (bond.at2.label != ''){
			l.p2 = trimEnd(bond.at2, l.p1, l.p2)
 		}
	});
};

function TrimLineEnd(p1, p2, trimSize){
	let dX = p2.x-p1.x;
	let dY = p2.y-p1.y;
	let len = Math.sqrt(dX**2 + dY**2);
	let ratio = trimSize/len;
	if (ratio > 1){
		return {x: p1.x, y: p1.y};
	}
	return {x: p2.x-dX*ratio, y: p2.y-dY*ratio};
};

function TrimLineEndY(p1, p2, trimSizeY, trimMaxX){
	let dX = p2.x-p1.x;
	if ((dX >= 0 && trimMaxX > 0) || (dX <= 0 && trimMaxX < 0)) return TrimLineEnd(p1, p2, TRIM_SIZE);
	let dY = p2.y-p1.y;
	let ratio = (Math.abs(dY)-trimSizeY)/Math.abs(dY); // may be -infinity, max function will be OK
	ratio = Math.max(ratio, (-dX-trimMaxX)/-dX);
	if (ratio > 1){
		return {x: p1.x, y: p1.y};
	}
	return {x: p1.x+dX*ratio, y: p1.y+dY*ratio};
};

function OnKeyPress(e) {
	if (!mousePos.mouseOver) return;
	switch (e.key){
		case 'Delete':
		case 'Backspace':
			if (activeLine !== null && !selected.includes(activeLine)) selected.push(activeLine);
			if (activePoint !== null && !selected.includes(activePoint)) selected.push(activePoint);
			DeleteSelected();
			break;
		case 'z':
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				e.stopPropagation();
				history.back();
			}
			break;
		case 'Z':
			e.preventDefault();
			e.stopPropagation();
			if (e.metaKey && e.shiftKey) {
				history.forward();
			}
			break;
		case 'y':
			if (e.ctrlKey) history.forward();
			break;
		case 'c':
			if (e.ctrlKey || e.metaKey) clipboard.copy();
			break;
		case 'v':
			if (e.ctrlKey || e.metaKey) clipboard.paste();
			break;
		case 'x':
			if (e.ctrlKey || e.metaKey) CutSelected();
			break;
		case 'a':
			if (e.ctrlKey || e.metaKey){
				e.preventDefault();
				e.stopPropagation();
				SelectAll();
			}
			break;
		case 'Escape':
			ChangeMode(MODE_IDLE);
			break;
	}
		
	let atom = HOTKEYS_ATOMS[e.key];
	if ((atom !== undefined) && (!e.ctrlKey) && (!e.metaKey)){
		ct.toolBtn[atom].callback();
	}
};

function OnMouseClick(e) {
	e.preventDefault();
	e.stopPropagation();
	let x = parseInt(e.clientX-canvas.getBoundingClientRect().left);
	let y = parseInt(e.clientY-canvas.getBoundingClientRect().top);	
	horizontalMenu.classList.add('hidden');
	HoverOverItems(x, y);
	mousePos.noMove = true;
	StartDrawingBond(x,y);
	StartDragging(activePoint);
	Erase();
	ChangeBondType();
	ChangeCharge();
	Highlight();
	placePreview.place();
};

function OnMouseMove(e) {
	e.preventDefault();
	e.stopPropagation();
	let x = parseInt(e.clientX-canvas.getBoundingClientRect().left);
	let y = parseInt(e.clientY-canvas.getBoundingClientRect().top);	
	if (mousePos.noMove && 
		Math.abs(mousePos.x-x) < NO_MOVE_TOL && 
		Math.abs(mousePos.y-y) < NO_MOVE_TOL
		) return;
	mousePos.x = x;
	mousePos.y = y;
	ClearScene(ctxo);
	HoverOverItems(x, y);
	if (e.buttons === 1){ // if left pressed
		Erase();
	}
	Highlight();
	if (mousePos.noMove === true){
		StartSelectDrag(x,y);
		mousePos.noMove = false
	}
	SetDraggingPtPos(x,y, e.ctrlKey, e.shiftKey);
	SelectDragChange(x,y);
	placePreview.move(x,y);
};

function OnMouseUp(e) {
	e.preventDefault();
	e.stopPropagation();
	EndDragging();
	EndSelectDrag();
	if (mousePos.noMove) SelectActive(e.shiftKey || e.ctrlKey || e.metaKey);
	mousePos.noMove = false
	ClearScene(ctxo);
	placePreview.place();
	Highlight();
};

function OnTouchStart(e) {
	e.preventDefault();
	e.stopPropagation();
	let x = parseInt(e.changedTouches[0].clientX-canvas.getBoundingClientRect().left);
	let y = parseInt(e.changedTouches[0].clientY-canvas.getBoundingClientRect().top);	
	horizontalMenu.classList.add('hidden');
	mousePos.noMove = true;
	mousePos.x = x;
	mousePos.y = y;
	HoverOverItems(x, y);
	Highlight();
	StartDrawingBond(x,y);
	StartDragging(activePoint);
	ChangeBondType();
	ChangeCharge();
	StartSelectDrag(x,y);
	Erase();
	placePreview.draw();
};

function OnTouchMove(e) {
	e.preventDefault();
	e.stopPropagation();
	let x = parseInt(e.changedTouches[0].clientX-canvas.getBoundingClientRect().left);
	let y = parseInt(e.changedTouches[0].clientY-canvas.getBoundingClientRect().top);
	if (mousePos.noMove && 
		Math.abs(mousePos.x-x) < NO_MOVE_TOL && 
		Math.abs(mousePos.y-y) < NO_MOVE_TOL
		) return;
	let dx = x - mousePos.x; 
	let dy = y - mousePos.y; 
	mousePos.x = x;
	mousePos.y = y;
	mousePos.noMove = false;
	ClearScene(ctxo);
	HoverOverItems(x, y);
	Erase();
	Highlight();
	SetDraggingPtPos(x,y, false, false);
	SelectDragChange(x,y);
	placePreview.move(dx,dy,'relative');
};

function OnTouchEnd(e) {
	e.preventDefault();
	e.stopPropagation();
	EndDragging();
	EndSelectDrag();
	if (mousePos.noMove) {
		SelectActive(e.shiftKey);
		ClearScene(ctxo);
		placePreview.place();
		Highlight();
	}
};

function StartSelectDrag(x,y){
	if (mode != MODE_IDLE){
		return;
	}
	mode = MODE_SELECTING;
	selectRect.x1 = x;
	selectRect.y1 = y;
	selectRect.x2 = x;
	selectRect.y2 = y;
};

function SelectDragChange(x, y){
	if (mode != MODE_SELECTING) return;
	ctxo.lineWidth = SELECTING_RECT_LINE_WIDTH;
	ctxo.strokeStyle = SELECTING_RECT_OUTLINE;
	ctxo.fillStyle = SELECTING_RECT_FILL;
	selectRect.x2 = x;
	selectRect.y2 = y;
	ClearScene(ctxo);
	ctxo.beginPath();
	ctx.beginPath();
	ctxo.rect(selectRect.x1, selectRect.y1, x-selectRect.x1, y-selectRect.y1);
	ctx.rect(selectRect.x1, selectRect.y1, x-selectRect.x1, y-selectRect.y1);
	ctxo.fill();
	ctxo.stroke();
	selected = []
	sceneMol.atoms.forEach(function(at){
		if (ctx.isPointInPath(at.x*devicePixelRatio, at.y*devicePixelRatio)){
			selected.push(at);
		}
	});
	sceneMol.bonds.forEach(function(b){
		let x = (b.at1.x + b.at2.x)/2*devicePixelRatio;
		let y = (b.at1.y + b.at2.y)/2*devicePixelRatio;
		if (ctx.isPointInPath(x, y)){
			selected.push(b);
		}
	});
	Highlight();
};

function EndSelectDrag(){
	if (mode != MODE_SELECTING) return;
	mode = activeMode;
	ClearScene(ctxo)
	Highlight()
};

function DeleteSelected(){
	if (!selected.length){
		return;
	}
	selected.forEach( el => sceneMol.removeElement(el));
	selected = [];
	activePoint = null;
	activeLine = null;
	scene.update();
	scene.draw();
	ChangeMode(activeMode);
	history.makeSnapshot();
};

function SelectActive(shiftPressed){
	if (mode != MODE_IDLE) return;
	let toAdd;
	if (!shiftPressed){
		selected = [];
	}
	if (activeLine != null){
		toAdd = activeLine;
	} else if (activePoint != null){
		toAdd = activePoint;
	} else {
		return;
	}
	let i = selected.indexOf(toAdd);
	if (i != -1){
		selected.splice(i, 1);
	} else {
		selected.push(toAdd);
	}
	ClearScene(ctxo);
	Highlight()
};

function Highlight(){
	let sel_atoms = []
	let sel_bonds = []
	selected.forEach(el => (el instanceof Atom) ? sel_atoms.push(el) : sel_bonds.push(el))
	HighlightElements(sel_bonds, SELECTED_COLOR_BOND);
	HighlightElements(sel_atoms, SELECTED_COLOR_ATOM);
	if (activeLine){
		HighlightElements([activeLine], HOVER_COLOR)
	} else if (activePoint){
		HighlightElements([activePoint], HOVER_COLOR)
	}
	if (selected.length == 0){
		ct.btn.copy.disable();
		ct.btn.cut.disable();
		// ct.btn.delete.disable();
	} else {
		ct.btn.copy.enable();
		ct.btn.cut.enable();
		// ct.btn.delete.enable();
	}
};

function HighlightElements(elements, color) {
	ctxo.save();
	ctxo.fillStyle = color;
	ctxo.strokeStyle = color;
	ctxo.lineWidth = LINE_HOVER_WIDTH;
	elements.forEach(function(element){
		ctxo.beginPath();
		if (element.lines == undefined){
			ctxo.arc(element.x, element.y, POINT_HOVER_RADIUS, 0, 2 * Math.PI);
			ctxo.fill();
		} else {
			ctxo.moveTo(element.at1.x, element.at1.y);
			ctxo.lineTo(element.at2.x, element.at2.y);
			ctxo.stroke();
		}
	});
	ctxo.restore()
};

function Erase(){
	if (mode != MODE_ERASER) return;
	if (activeLine != null){
		selected = [activeLine];
		activeLine = null;
	} else if (activePoint != null){
		selected = [activePoint];
		activePoint = null;
	} else {
		return;
	}
	DeleteSelected();
};

function ChangeCharge(){
	if (!activePoint) return;
	if (mode === MODE_DRAW_CHARGE_PLUS){
		activePoint.charge += 1;
	} else if (mode === MODE_DRAW_CHARGE_MINUS){
		activePoint.charge -= 1;
	} else {
		return;
	}
	activePoint.render();
	activePoint.bonds.forEach(b => b.render())
	scene.draw();
	history.makeSnapshot();
};

function ChangeBondType(){
	if (mode != MODE_DRAW_IDLE || !activeLine) return;
	activeLine.type = (activeLine.type)%3 + 1;
	activeLine.at1.render();
	activeLine.at2.render();
	activeLine.at1.bonds.forEach(b => b.render()); // beacuse of C atoms
	activeLine.at2.bonds.forEach(b => b.render()); // active line is rendered twice...
	scene.draw();
	history.makeSnapshot();
};

function ChangeMode(new_mode,atom){
	canvasWrapper.classList.remove('cursor-crosshair');
	canvasWrapper.classList.remove('cursor-eraser');
	selected = [];
	if (mode === MODE_DRAWING) history.loadSnapshot();
	if (mode === MODE_PASTING) placePreview.remove();
	ClearScene(ctxo);
	Object.values(ct.toolBtn).forEach(b => b.enable());
	if (drawingModes.includes(new_mode)){
		ct.btn.draw.active();
		ct.btn.drawCollapsed.active();
		ct.btn.select.enable();	
		ct.btn.erase.enable();
	}
	if (new_mode === MODE_DRAW_IDLE){
		activeMode = MODE_DRAW_IDLE;
		if (atom !== undefined){
			currentAtomType = atom;
		}
		ct.toolBtn[currentAtomType].active();
		ct.btn.drawCollapsed.changeActive(ct.toolBtn[currentAtomType]);
	} else if (new_mode === MODE_IDLE){
		activeMode = MODE_IDLE;
		ct.btn.select.active();
		ct.btn.draw.enable();
		ct.btn.drawCollapsed.enable();
		ct.btn.erase.enable();
		canvasWrapper.classList.add('cursor-crosshair');
	} else if (new_mode === MODE_ERASER){
		activeMode = MODE_ERASER;
		ct.btn.erase.active();
		ct.btn.draw.enable();
		ct.btn.drawCollapsed.enable();
		ct.btn.select.enable();
		canvasWrapper.classList.add('cursor-eraser');
	} else {
		mode = new_mode;
		return;
	}
	mode = activeMode;
	Highlight();
};

function StartDrawingBond(posX,posY){ //creates 1 or 2 new atoms and bond
	if (mode != MODE_DRAW_IDLE || activeLine != null) return;
	mode = MODE_IDLE;
	const newAtom = sceneMol.newAtom(posX, posY, currentAtomType);
	if (activePoint){
		sceneMol.newBond(activePoint, newAtom, 1)
	} else {
		let startAtom = sceneMol.newAtom(posX, posY, currentAtomType);
		sceneMol.newBond(startAtom, newAtom, 1)
		activePoint = startAtom;
	}
	StartDragging(newAtom);
};

function StartDragging(atomToDrag){
	if (mode !== MODE_IDLE || !atomToDrag || !activePoint) return;
	mode = MODE_DRAWING;
	drawPreview.clear();
	draggingPoint = atomToDrag;
	draggingMol = new Molecule();
	currentAtomType = draggingPoint.type;
	draggingMol.addAtom(draggingPoint);
	draggingPoint.bonds.forEach(b => draggingMol.addBond(b));
	sceneMol.popAtom(draggingPoint);
	draggingPoint.getAdjacent().forEach(adj => {
		sceneMol.popAtom(adj);
		draggingMol.addAtom(adj);
		adj.bonds.forEach(b => {
			if (draggingMol.bonds.indexOf(b) === -1){
				draggingMol.addBond(b);
			}
		});
	});
	scene.draw();
	SetDraggingPtPos(activePoint.x, activePoint.y, false, false);
};

function EndDragging(){
	if (mode != MODE_DRAWING) return;
	if (!scene.bBoxIsInside(draggingMol.getBBox())) {
		ChangeMode(activeMode);
		return;
	}
	mode = activeMode;
	sceneMol.unify(draggingMol);
	ClearScene(ctxo);
	scene.update();
	scene.draw();
	//console.log('end drag bonds:', sceneMol.bonds.length)
	draggingPoint = null;
	history.makeSnapshot();
};

function SetDraggingPtPos(posX, posY, unr_angle, unr_length){
	if (mode !== MODE_DRAWING) return;
	drawPreview.snapAtomRestore();
	if (activePoint){
		draggingPoint.x = activePoint.x;
		draggingPoint.y = activePoint.y;
		draggingMol.render();
		let draggingBonds = draggingPoint.bonds
		let dragBack = (draggingBonds.length === 1) && (draggingBonds[0].at1.overlaps(draggingBonds[0].at2))

		if (dragBack && mousePos.noMove && currentAtomType === activePoint.type){  // extend skeleton
			ExtendSkeleton(draggingBonds[0],draggingPoint);
			draggingPoint.render();
			activePoint.render();
			draggingBonds[0].render();
		} else if (dragBack){  // change type if end atom
			drawPreview.snapAtomSave();	
			activePoint.type = draggingPoint.type;
			let i = activePoint.bonds.indexOf(draggingBonds[0]);
			if (i !== -1) activePoint.bonds.splice(i,1);
			activePoint.render();
			activePoint.bonds.forEach( b => b.render());
			activePoint.bonds.push(draggingBonds[0])
			draggingPoint.label = '';
		} else {					// drag snap
			drawPreview.draggingPointSave();
			activePoint.clone(draggingPoint);
			draggingBonds.forEach( b => b.render());
			drawPreview.draggingPointRestore();
			if (activePoint !== draggingPoint) draggingPoint.label = '';  // click without move -> keep label
		}
	} else {	// free drag
		if (draggingPoint.bonds.length == 1){
			let at1 = draggingPoint.getAdjacent(draggingPoint.bonds[0]);
			let p = {x : posX, y : posY};
			if (!unr_angle) p = LineSnapAngle(at1.x, at1.y, p.x, p.y);
			if (!unr_length) p = ShortenLine(at1.x, at1.y, p.x, p.y);
			draggingPoint.x = p.x;
			draggingPoint.y = p.y;	
		} else {					//dragging atom with multiple bonds
			draggingPoint.x = posX;
			draggingPoint.y = posY;
		}
		draggingMol.render();
	}
	scene.drawDraggingMol();
};

function ExtendSkeleton(bond,atomToAdjust){
	let atom = atomToAdjust.getAdjacent(bond); // rotation is reversed (due to -y)
	let angles = [];
	switch (atom.bonds.length-1){
		case 0:
			angles = [30,330,150,210];
			break;
		case 1:
			let prevBond = atom.bonds[0];
			if (prevBond == bond) prevBond = atom.bonds[1];
			let prevAngle = atom.angleToAtom(atom.getAdjacent(prevBond));
			prevAngle = 360 - prevAngle*180/Math.PI;   // reverse rotation (due to -y)
			let boundryAngles = [0,90,180,270,360];
			for (let i=0; i<boundryAngles.length; i++){
				if (Math.abs(prevAngle - boundryAngles[i]) < NUM_TOL){
					if (prevAngle <= boundryAngles[i]){
						prevAngle -= NUM_TOL;
					} else if (prevAngle > boundryAngles[i]){
						prevAngle += NUM_TOL;
					}
					break;
				}
			}
			if (prevAngle < 90){
				angles = [prevAngle+120,prevAngle+240];
			} else if (prevAngle < 180){
				angles = [prevAngle+240,prevAngle+120];
			} else if (prevAngle < 270){
				angles = [prevAngle+120,prevAngle+240];
			} else {
				angles = [prevAngle+240,prevAngle+120];
			}
			break;
		default:
			let angleDiff = [];
			let bondAngles = [];
			let n = atom.getAdjacent();
			let i = n.indexOf(atomToAdjust);
			if (i !== -1) n.splice(i,1);
			n.forEach(at => bondAngles.push(atom.angleToAtom(at)));
			bondAngles.sort((a,b) => a-b);
			bondAngles.push(2*Math.PI+bondAngles[0]);
			for (let i=0; i < atom.bonds.length-1; i++){    // bonds.length -1 for dummy drag bond
				let	diff = bondAngles[i+1] - bondAngles[i];
				let angle = 360 - ((bondAngles[i] + diff/2)/Math.PI*180)%360;
				angleDiff.push({'angleDiff' : diff, 'angle' : angle})

			}

			angleDiff.sort( (a, b) => a.angle - b.angle)
			angleDiff.sort( (a, b) => {if (Math.abs(b.angleDiff - a.angleDiff) < NUM_TOL) return 0;return b.angleDiff - a.angleDiff})
			angleDiff.forEach(a => angles.push( a.angle ))

		break;
	}
	for (let i = 0; i < angles.length; i++){
		if (BondSetAngle(bond,atomToAdjust,angles[i])){
			return;
		}
	}
};

function BondSetAngle(bond, atomToAdjust, angle){
	let a = angle/180*Math.PI;
	let atom = atomToAdjust.getAdjacent(bond);
	let newX = atom.x + LINE_LENGTH* Math.cos(a);
	let newY = atom.y - LINE_LENGTH* Math.sin(a);
	if (!scene.atomIsInside({ x: newX, y: newY })) return false;
	atomToAdjust.x = newX;
	atomToAdjust.y = newY;
	return true;
}

function DrawLine(context, line){
	if (PointsAreEqual(line.p1, line.p2)){
		return;
	}
	context.beginPath();
	context.moveTo(line.p1.x, line.p1.y);
	context.lineTo(line.p2.x, line.p2.y);
	context.stroke();
};

function HoverOverItems(posX,posY){
	if (posX === undefined ||  posY === undefined){
		posX = mousePos.x;
		posY = mousePos.y;
	}
	posX *= devicePixelRatio;
	posY *= devicePixelRatio;
	function scanAtoms(atoms){
		let i=0;
		let at;
		while (at = atoms[i++]){
			ctxo.beginPath();
			ctxo.arc(at.x, at.y, POINT_HOVER_RADIUS, 0, 2 * Math.PI);
			if (ctxo.isPointInPath(posX,posY) && at !== draggingPoint) {
				return at;
			}
		}
		return null;
	}

	function scanBonds(bonds){
		ctxo.lineWidth = LINE_HOVER_WIDTH;
		let i=0;
		let b;
		while (b = bonds[i++]){
			ctxo.beginPath();
			ctxo.moveTo(b.at1.x, b.at1.y);
			ctxo.lineTo(b.at2.x, b.at2.y);
			if (ctxo.isPointInStroke(posX,posY)) {
				return b;
			}
		}
		return null;
	}
	activeLine = null;
	activePoint = null;
	ctxo.clearRect(0,0,overlay.width,overlay.height);

	if (mode === MODE_DRAWING){
		activePoint = scanAtoms(draggingMol.atoms);
	}
	if (activePoint === null) {
		activePoint = scanAtoms(sceneMol.atoms)
	}
	if (activePoint === null && mode !== MODE_DRAWING){
		activeLine = scanBonds(sceneMol.bonds)
	}
};

function PointsAreEqual(p1, p2){
	return (p1.x==p2.x && p1.y==p2.y);
};

function ParallelLines(axis, spread){
	let dX = axis.p2.x-axis.p1.x;
	let dY = axis.p2.y-axis.p1.y;
	let len = Math.sqrt(dX**2 + dY**2);
	let ratio = spread/len/2;
	let p1 = {x: axis.p1.x-ratio*dY, y: axis.p1.y+ratio*dX},
	p2 = {x: axis.p2.x-ratio*dY, y: axis.p2.y+ratio*dX},
	p3 = {x: axis.p1.x+ratio*dY, y: axis.p1.y-ratio*dX},
	p4 = {x: axis.p2.x+ratio*dY, y: axis.p2.y-ratio*dX};
	return [{p1: p1, p2: p2}, {p1: p3, p2: p4}]
};

function BondToLine(bond){
	let p1 = {}, p2 = {};
	p1.x = bond.at1.x;
	p1.y = bond.at1.y;
	p2.x = bond.at2.x;
	p2.y = bond.at2.y;
	return {p1: p1, p2: p2}
};

function ClearScene(ctx) {
	ctx.clearRect(0, 0, canvas.width/devicePixelRatio, canvas.height/devicePixelRatio);
};

function WhichSideIsAtom(b, at){
	return ((b.at2.x - b.at1.x)*(at.y - b.at1.y) - (b.at2.y - b.at1.y)*(at.x - b.at1.x))
};

function CalcSMILES() {
	const BOND_SYMBOLS = {1:'', 2:'=', 3:'#'};

	function IsInvariant(){
		let isInvariant = true;
		ranks.sort(function(e1,e2){
			if (e1.prevRank == e2.prevRank){
				return e1.rank-e2.rank;
			}
			return 0;
		});
		let lastRank = 0;
		let lastCurrentRank = 0;
		let i = 0;
		ranks.forEach(function(r){
			if (r.prevRank != lastRank || r.rank != lastCurrentRank) {
				i += 1;
			}
			lastRank = r.prevRank;
			lastCurrentRank = r.rank;
			r.rank = i;

			if (r.prevRank != r.rank) isInvariant = false;
			r.prevRank = r.rank;
		});

		return isInvariant;
	}

	function RankIt(){
		while (!IsInvariant()){
			ranks.forEach(function(r){
				r.rank = 1;
				r.neihgbours.forEach(n => r.rank *= primes[n.node.prevRank-1]**n.multiplicity)
			});
		}
	}

	function PrintRanks(){ // debug only
		ctx.save()
		ctx.fillStyle = 'red'
		ranks.forEach(function(r){
			ctx.fillText(r.rank,r.at.x+10, r.at.y+10)
		});
		ctx.restore()
	}

	function GetBranch(origin, node){
		let connection = node.neihgbours.find(el => el.node === origin);

		if (node.visited) {
			let mult = connection.multiplicity;
			origin.cycles.push({node:node, bond:mult, number: undefined});
			return null;
		}
		node.visited = true;

		let branches = [node];
		
		if (node.at.charge == 0) {
			node.label = node.at.type;
		} else {
			let s = node.at.charge > 0 ? '+' : '-';
			let c = Math.abs(node.at.charge);
			c = c > 1 ? c : '';
			node.label = (`[${node.at.label}${s}${c}]`);
		}

		if (origin === null){
			if (node.neihgbours.length === 0) return branches
		} else {
			//let bondOrder = origin.at.bonds.reduce((pv, b) => 
			//	(b.at1 === node.at || b.at2 === node.at) ? pv+=b.type : pv,0);
			let bondOrder = connection.multiplicity;
			node.label = BOND_SYMBOLS[bondOrder] + node.label;
			if (node.neihgbours.length === 1) return branches;
		}


		let ns = [];
		node.neihgbours.forEach(n => {if (n.node !== origin) ns.push(n.node)});
		ns.sort((e1,e2) => e1.rank-e2.rank);
		let backbone = GetBranch(node, ns[ns.length-1])
		let i=0;
		while (i < ns.length-1){
			let br = GetBranch(node,ns[i]);
			if (br !== null)	branches.push(br);
			i++;
		}
		branches.push.apply(branches, backbone);
		return branches;
	}

	function NodeArrayToStr(element){
		if (!Array.isArray(element)){
			element.cycles.forEach(function(c){
				if (c.number === undefined){   // no number assigned to cycle
					ringCounter++;
					c.number = ringCounter;
					let otherNodeCycle = c.node.cycles.find(el => el.node == element);
					otherNodeCycle.number = ringCounter
				} else {					// cycle already has a number
					element.label += BOND_SYMBOLS[c.bond]
				}
			});
			element.cycles.sort((el1,el2) => el1.number-el2.number);
			element.cycles.forEach(c => {
				if (c.number > 9) {
					element.label += '%';
				}
				element.label += c.number});
			return element.label;
		}
		let str = '(';
		element.forEach(e => str += NodeArrayToStr(e))
		str += ')'
		return str
	}
	if (sceneMol.atoms.length == 0) return [];
	var ranks = []
	sceneMol.atoms.forEach(function(at){
		let vector = 0;
		vector += 1000000*at.bonds.length
		vector += 100000*at.bonds.reduce((pv, b) => pv + b.type, 0)
		vector += 1000*ELEMENTS_TABLE[at.type].atNo
		if (at.charge < 0) vector += 100*at.hCount
		vector += 10*Math.abs(at.charge)
		vector += at.hCount
		ranks.push({at : at, vector : vector, prevRank : 1,
					rank: vector, visited : false, cycles : []})
	});
	ranks.forEach(function(r){
		let bonds = r.at.bonds;
		r.neihgbours = [];
		bonds.forEach(b => {
			let adj = r.at.getAdjacent(b);
			let n = {};
			n.node = ranks[sceneMol.atoms.indexOf(adj)];
			n.multiplicity = b.type;
			r.neihgbours.push(n);
		});
	});
	let primes = [2];
	let i = 3;
	while (primes.length < ranks.length){
		if (primes.every(p => i%p != 0)){
			primes.push(i)
		}
		i += 2;
	}
	RankIt()
	while (ranks.length != ranks[ranks.length-1].rank) {
		ranks.forEach(r => r.rank *= 2)
		let prevRank = 0;
		let i = 0;
		while (true){
			if (ranks[i].rank == prevRank) {
				ranks[i-1].rank -= 1;
				break;
			}
			prevRank = ranks[i].rank;
			i++;
		}
		RankIt()
	}
	//PrintRanks()
	let startNode, branches, smiles, smilesAll=[], ringCounter;
	while (startNode = ranks.find(r => !r.visited)){
		ringCounter = 0;
		branches = GetBranch(null,startNode);
		smiles = NodeArrayToStr(branches);
		smiles = smiles.substring(1,smiles.length-1);
		smilesAll.push(smiles)
	}
	//console.log('total', branches);
	//console.log('smiles', smilesAll);
	return smilesAll;
};

function showSMILES(){
	const smiles = CalcSMILES();
	window.prompt('SMILES string:', smiles);
	sceneMol.dump();
};

function createRing(n){
		const ring = new Molecule();
		let r = LINE_LENGTH/2/Math.sin(Math.PI/n);
		let angle = 360/n*Math.PI/180;
		for (let i=0; i<n; i++){
			ring.newAtom(r*Math.sin(angle*i)+LINE_LENGTH+r, 
						-r*Math.cos(angle*i)+LINE_LENGTH+r, 'C');
		}
		ring.atoms.forEach((at,i) => ring.newBond(at, ring.atoms[(i+1)%n], 1));
		return ring;
};

function importMolecule(){
	let mol = window.prompt('Import molecule','');
	if (mol === null || mol === '') return;
	sceneMol.parse(mol);
	scene.update();
	scene.draw();
	history.makeSnapshot();
};


function setColorScheme(scheme) {
	switch (scheme) {
		case 'dark':
			LINE_COLOR = '#ededed';
			SELECTING_RECT_FILL = '#414141';
			SELECTING_RECT_OUTLINE = '#707070';
			SELECTED_COLOR_BOND = '#595959';
			SELECTED_COLOR_ATOM = '#707070';
			PASTING_LINE_COLOR = 'rgb(120,180,255)';
			INVALID_COLOR = 'rgb(255,60,60)';
			break;
		case 'light':
			LINE_COLOR = 'black';
			SELECTING_RECT_FILL = 'rgb(220, 235, 255)',
			SELECTING_RECT_OUTLINE = 'rgb(130, 170, 255)',
			SELECTED_COLOR_BOND = 'rgb(150, 190, 255)',
			SELECTED_COLOR_ATOM = 'rgb(230, 140, 255)',
			PASTING_LINE_COLOR = 'rgba(100,150,255,0.8)',
			INVALID_COLOR = 'rgba(255,0,0,0.7)';
		break;
	}	
}


function changeTheme(theme){
	setColorScheme(theme);
	scene.draw();
	Highlight();
}

function initContext(cx) {
	cx.scale(devicePixelRatio, devicePixelRatio);
	cx.strokeStyle = LINE_COLOR;
	cx.lineWidth = LINE_WIDTH;
	cx.lineCap = 'round';
	cx.font = FONT_ATOMS;
	cx.textAlign = 'center';
	cx.textBaseline = 'middle';
	cx.textBaseline = 'alphabetic';
	cx.fillStyle = 'black';
	cx.strokeStyle = 'black';
}

function drawMolecule(canvas, data){
	const CANVAS_WIDTH = canvas.offsetWidth/devicePixelRatio
	const CANVAS_HEIGHT = canvas.offsetHeight/devicePixelRatio
	const cx = canvas.getContext('2d');
	initContext(cx);
	sceneMol.parse(data);
	scene.update();
	const bb = sceneMol.getBBoxText();
	let scale = Math.min(CANVAS_WIDTH/bb.width, CANVAS_HEIGHT/bb.height)
	scale = Math.min(scale, 1);
	cx.scale(scale,scale)
	cx.translate(-bb.cx+CANVAS_WIDTH/2/scale,-bb.cy+CANVAS_HEIGHT/2/scale)
	sceneMol.draw(cx)
}

return {
	getSmiles: CalcSMILES,
	scene: function(){return sceneMol;},
	isEmpty: function(){return sceneMol.atoms.length === 0},
	dump : function(){return sceneMol.dump();},
	load : function(data){sceneMol.parse(data); scene.update(); scene.draw(); history.makeSnapshot();},
	getFormula : ()=>JSON.stringify(molecularFormula.formula),
	changeTheme : (theme) => changeTheme(theme),
	drawMolecule : drawMolecule,
	initUI : initUI
}
})();

