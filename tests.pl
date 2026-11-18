/* tests.pl -- unit tests for hanoi.pl.  Run:  swipl -g run_tests -t halt tests.pl */
:- use_module(library(plunit)).
:- use_module(hanoi).

:- begin_tests(hanoi).

test(min_moves) :- min_moves(0,0), min_moves(3,7), min_moves(10,1023).
test(solution_length, [forall(member(N,[1,2,3,4,5,8]))]) :-
    hanoi_moves(N, M), length(M, L), min_moves(N, L).
test(three_disks) :-
    hanoi_moves(3, M),
    M == [move(1,0,2),move(2,0,1),move(1,2,1),move(3,0,2),
          move(1,1,0),move(2,1,2),move(1,0,2)].
test(solution_is_legal_and_solves, [forall(member(N,[1,2,3,5,7]))]) :-
    initial_state(N, S0), hanoi_moves(N, Ms),
    foldl([move(D,F,T),A,B]>>( A=[_,_,_], nth0(F,A,[D|_]), try_move(A,F,T,B,ok) ),
          Ms, S0, Final),
    solved(Final, N).
test(illegal_big_on_small) :-
    try_move([[2],[1],[]], 0, 1, S, error(larger_on_smaller)), S == [[2],[1],[]].
test(illegal_empty)  :- try_move([[],[1],[]], 0, 1, _, error(empty_tower)).
test(illegal_same)   :- try_move([[1],[],[]], 0, 0, _, error(same_tower)).
test(illegal_index)  :- try_move([[1],[],[]], 0, 5, _, error(bad_tower)).
test(legal_move)     :- try_move([[1,2],[],[]], 0, 1, S, ok), S == [[2],[1],[]].
test(legal_onto_bigger) :- try_move([[1],[2],[]], 0, 1, S, ok), S == [[],[1,2],[]].
test(not_solved)     :- \+ solved([[1,2],[],[]], 2).

:- end_tests(hanoi).
