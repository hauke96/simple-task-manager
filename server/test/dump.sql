-- 
-- Reset database
-- 
DELETE FROM projects;
DELETE FROM tasks;
DELETE FROM db_versions WHERE version='test';

--
-- Data for Name: db_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--
INSERT INTO db_versions VALUES ('test');

--
-- Project 1
--
INSERT INTO projects(id, name, task_ids, users, owner) VALUES (1, 'Project 1', '{1}', '{Peter,Maria}', 'Peter');
INSERT INTO tasks(id, process_points, max_process_points, geometry, assigned_user) VALUES (1, 0, 10, '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[0.00008929616120192039,0.00048116846605239516],[0.00008929616120192039,0.0004811765447811922],[0.00008930976265082209,0.0004811765447811922],[0.00008930976265082209,0.00048116846605239516],[0.00008929616120192039,0.00048116846605239516]]]},"properties":null}', 'Peter');

--
-- Project 2
--
INSERT INTO projects(id, name, task_ids, users, owner) VALUES (2, 'Project 2', '{2,3,4,6,7}', '{Maria,John,Anna,Carl,Donny,Clara}', 'Maria');
INSERT INTO tasks(id, process_points, max_process_points, geometry, assigned_user) VALUES (2, 100, 100, '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[0.00008929616120192039,0.0004811765447811922],[0.00008929616120192039,0.00048118462350998925],[0.00008930976265082209,0.00048118462350998925],[0.00008930976265082209,0.0004811765447811922],[0.00008929616120192039,0.0004811765447811922]]]},"properties":null}', '');
INSERT INTO tasks(id, process_points, max_process_points, geometry, assigned_user) VALUES (3, 50, 100, '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[9.944421814136854,53.56429528684478],[9.944078491382948,53.56200127796407],[9.94528012102162,53.56195029857588],[9.946653412037245,53.56429528684478],[9.944421814136854,53.56429528684478]]]},"properties":null}', 'Maria');
INSERT INTO tasks(id, process_points, max_process_points, geometry, assigned_user) VALUES (4, 0, 100, '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[9.951631591968885,53.563785517845105],[9.935667083912245,53.55022340710764],[10.00639157121693,53.53675896834966],[10.013773010425917,53.570921724776724],[9.951631591968885,53.563785517845105]]]},"properties":null}', '');
INSERT INTO tasks(id, process_points, max_process_points, geometry, assigned_user) VALUES (6, 1, 4, '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[9.951631591968885,53.563785517845105],[9.935667083912245,53.55022340710764],[10.00639157121693,53.53675896834966],[10.013773010425917,53.570921724776724],[9.951631591968885,53.563785517845105]]]},"properties":null}', '');
INSERT INTO tasks(id, process_points, max_process_points, geometry, assigned_user) VALUES (7, 3, 4, '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[9.951631591968885,53.563785517845105],[9.935667083912245,53.55022340710764],[10.00639157121693,53.53675896834966],[10.013773010425917,53.570921724776724],[9.951631591968885,53.563785517845105]]]},"properties":null}', '');

--
-- Project 3
--
INSERT INTO projects(id, name, task_ids, users, owner) VALUES (3, 'Project 3', '{5}', '{Otto}', 'Otto');
INSERT INTO tasks(id, process_points, max_process_points, geometry, assigned_user) VALUES (5, 345, 1000, '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[9.951631591968885,53.563785517845105],[9.935667083912245,53.55022340710764],[10.00639157121693,53.53675896834966],[10.013773010425917,53.570921724776724],[9.951631591968885,53.563785517845105]]]},"properties":null}', '');

--
-- Raw tasks
--
INSERT INTO tasks(id, process_points, max_process_points, geometry, assigned_user) VALUES (8, 0, 100, '{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[9.951631591968885,53.563785517845105],[9.935667083912245,53.55022340710764],[10.00639157121693,53.53675896834966],[10.013773010425917,53.570921724776724],[9.951631591968885,53.563785517845105]]]},"properties":null}', '');

--
-- Reset sequences for primary keys
--
ALTER SEQUENCE projects_id_seq RESTART WITH 4;
ALTER SEQUENCE tasks_id_seq RESTART WITH 9;