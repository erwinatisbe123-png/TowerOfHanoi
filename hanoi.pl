/*  hanoi.pl  --  The Tower of Hanoi LOGIC ENGINE (pure Prolog)
    ----------------------------------------------------------
    Everything the website "knows" about the puzzle lives here:
      * generating the optimal solution
      * the minimum number of moves
      * the starting position
      * validating a move (the three rules of the puzzle)
      * detecting a finished puzzle

    A game STATE is a list of three towers: [Tower0, Tower1, Tower2].
    Each tower is a list of disk sizes with the TOP disk first.
    Disk 1 is the smallest.  Example, 3 disks at the start:
        [[1,2,3], [], []]
*/

:- module(hanoi, [ hanoi_moves/2,      % +N, -Moves
                   min_moves/2,        % +N, -Count
                   initial_state/2,    % +N, -State
                   try_move/5,         % +State0, +From, +To, -State, -Result
                   solved/2,           % +State, +N
                   reason_message/2    % +ErrorCode, -Text
                 ]).

:- use_module(library(lists)).
:- use_module(library(apply)).

/* ---------- 1. The classic recursive algorithm ---------- */

%% hanoi_moves(+N, -Moves)
%  Moves is the optimal list of move(Disk, FromTower, ToTower) terms that
%  carries N disks from tower 0 (source) to tower 2 (destination),
%  using tower 1 as the auxiliary peg.
hanoi_moves(N, Moves) :-
    integer(N), N >= 0,
    hanoi(N, 0, 2, 1, Moves, []).

% hanoi(+N, +From, +To, +Via, -Moves, ?Tail)   (difference list = fast)
hanoi(0, _, _, _, Moves, Moves) :- !.
hanoi(N, From, To, Via, Moves, Tail) :-
    N1 is N - 1,
    hanoi(N1, From, Via, To, Moves, [move(N, From, To)|Mid]),  % park N-1 disks on Via
    hanoi(N1, Via, To, From, Mid, Tail).                       % bring them onto the big disk

%% min_moves(+N, -Count)   Count = 2^N - 1
min_moves(N, Count) :-
    integer(N), N >= 0,
    Count is (1 << N) - 1.

/* ---------- 2. Game state ---------- */

%% initial_state(+N, -State)  all N disks on tower 0, smallest on top
initial_state(N, [Disks, [], []]) :-
    integer(N), N >= 1,
    numlist(1, N, Disks).

%% solved(+State, +N)  true when all N disks sit on tower 2 in order
solved([[], [], Disks], N) :-
    numlist(1, N, Disks).

/* ---------- 3. Move validation (the rules) ---------- */

tower_index(I) :- integer(I), between(0, 2, I).

%% try_move(+State0, +From, +To, -State, -Result)
%  Result is  ok  or  error(Code).  On error State = State0 (unchanged).
try_move(S0, From, To, S, Result) :-
    (   \+ ( tower_index(From), tower_index(To) )
    ->  S = S0, Result = error(bad_tower)
    ;   From =:= To
    ->  S = S0, Result = error(same_tower)
    ;   nth0(From, S0, [])                              % rule: only a real disk can move
    ->  S = S0, Result = error(empty_tower)
    ;   nth0(From, S0, [D|_]), nth0(To, S0, [Top|_]), D > Top   % rule: no big on small
    ->  S = S0, Result = error(larger_on_smaller)
    ;   apply_move(S0, From, To, S), Result = ok        % rules satisfied
    ).

% Take the top disk off tower From and put it on tower To.
apply_move(S0, From, To, S) :-
    nth0(From, S0, [D|RestFrom], R0),   % R0 = the other two towers
    nth0(From, S1, RestFrom, R0),       % put the shortened tower back
    nth0(To,   S1, ToTower,   R1),
    nth0(To,   S,  [D|ToTower], R1).

%% reason_message(+Code, -Text)  human friendly explanation
reason_message(bad_tower,         'That tower does not exist.').
reason_message(same_tower,        'The disk is already on that tower.').
reason_message(empty_tower,       'There is no disk on that tower to move.').
reason_message(larger_on_smaller, 'A larger disk cannot be placed on a smaller disk.').
