-- Deck reactions: "more like this" / "less like this" feed the ranker (v2).
alter table interactions drop constraint interactions_action_check;
alter table interactions add constraint interactions_action_check
  check (action in ('starred', 'used', 'dismissed', 'more', 'less'));
