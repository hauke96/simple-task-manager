import { TaskService } from './task.service';
import { Task, TaskDto, TestTaskFeature, TestTaskGeometry } from './task.material';
import { Extent } from 'ol/extent';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Polygon } from 'ol/geom';
import { User } from '../user/user.material';
import { UserService } from '../user/user.service';

describe(TaskService.name, () => {
  let service: TaskService;
  let httpClient: HttpClient;
  let userService: UserService;

  beforeEach(() => {
    httpClient = {} as HttpClient;
    userService = {} as UserService;

    service = new TaskService(httpClient, userService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set selected task correctly', () => {
    // Arrange
    const taskChangedSpy = jest.fn();
    service.selectedTaskChanged.subscribe(taskChangedSpy);
    const task = new Task('id123', '', 10, 100, TestTaskFeature);

    expect(service.getSelectedTask()).toBeFalsy();

    // Act
    service.selectTask(task);

    // Assert
    expect(service.getSelectedTask()).toEqual(task);
    expect(taskChangedSpy).toHaveBeenCalledWith(task);
  });

  it('should call server on create new task', done => {
    const maxProcessPoints = 100;

    httpClient.post = jest.fn().mockReturnValue(of([new TaskDto('id123', 0, 100, TestTaskGeometry)]));

    service.createNewTasks([TestTaskGeometry], maxProcessPoints)
      .subscribe({
        next: (newTasks: Task[]) => {
          expect(newTasks.length).toEqual(1);

          const expectedCoordinated = (TestTaskFeature.getGeometry() as Polygon).getCoordinates();

          const t = newTasks[0];
          expect(t).toBeTruthy();
          expect(t.id).toEqual('id123');
          expect((t.geometry.getGeometry() as Polygon).getCoordinates()).toEqual(expectedCoordinated);
          expect(t.maxProcessPoints).toEqual(maxProcessPoints);
          expect(t.processPoints).toEqual(0);
          expect(t.assignedUser).toBeFalsy();

          done();
        },
        error: e => fail(e)
      });
  });

  it('should call server to set process points', done => {
    const newProcessPoints = 50;
    const task = new Task('id123', '', 10, 100, TestTaskFeature);
    service.selectTask(task);

    httpClient.post = jest.fn().mockReturnValue(of(new TaskDto('id123', newProcessPoints, 100, TestTaskGeometry)));

    service.setProcessPoints('id123', newProcessPoints)
      .subscribe({
        next: t => {
          expect(t).toBeTruthy();
          expect(t.processPoints).toEqual(newProcessPoints);
          done();
        },
        error: e => fail(e)
      });
  });

  it('should cancel setting process points when other task selected', done => {
    const newProcessPoints = 50;
    const task = new Task('different-task', '', 10, 100, TestTaskFeature);
    service.selectTask(task);

    httpClient.post = jest.fn();

    service.setProcessPoints('id123', newProcessPoints)
      .subscribe({
        next: t => fail('Other task was selected'),
        error: () => {
          expect(httpClient.post).not.toHaveBeenCalled();
          done();
        }
      });
  });

  it('should call server on assign', done => {
    const task = new Task('id123', '', 10, 100, TestTaskFeature);
    const userToAssign = 'mapper-dave';
    service.selectTask(task);

    httpClient.post = jest.fn().mockReturnValue(of(new TaskDto('id123', 10, 100, TestTaskGeometry, '1')));
    userService.getUsersByIds = jest.fn().mockReturnValue(of([new User(userToAssign, '1')]));

    service.assign('id123')
      .subscribe({
        next: (t: Task | undefined) => {
          expect(t).not.toEqual(undefined);
          expect(t?.assignedUser).toBeTruthy();
          expect(t?.assignedUser?.uid).toEqual('1');
          expect(t?.assignedUser?.name).toEqual(userToAssign);
          done();
        },
        error: e => fail(e)
      });
  });

  it('should abort assign when other task selected', done => {
    const task = new Task('different-id', '', 10, 100, TestTaskFeature);
    httpClient.post = jest.fn();

    service.selectTask(task);

    service.assign('id123')
      .subscribe({
        next: () => fail('Other task was selected'),
        error: () => {
          expect(httpClient.post).not.toHaveBeenCalled();
          done();
        }
      });
  });

  it('should call server on unassign', done => {
    const userToUnassign = 'mapper-dave';
    const task = new Task('id123', '', 10, 100, TestTaskFeature, new User(userToUnassign, '2'));
    service.selectTask(task);

    httpClient.delete = jest.fn().mockReturnValue(of(new TaskDto('id123', 10, 100, TestTaskGeometry)));

    service.unassign('id123')
      .subscribe({
        next: t => {
          expect(t).toBeTruthy();
          expect(t.assignedUser).toEqual(undefined);
          done();
        },
        error: e => fail(e)
      });
  });

  it('should abort unassign when other task selected', done => {
    const userToUnassign = 'mapper-dave';
    const task = new Task('different-id', '', 10, 100, TestTaskFeature, new User(userToUnassign, '2'));
    httpClient.post = jest.fn();

    service.selectTask(task);

    service.unassign('id123')
      .subscribe({
        next: t => fail('Other task was selected'),
        error: () => {
          expect(httpClient.post).not.toHaveBeenCalled();
          done();
        }
      });
  });

  it('should calculate the extent correctly', () => {
    const task = new Task('id123', '', 10, 100, TestTaskFeature);

    const extent: Extent = service.getExtent(task);

    expect(extent[0]).toEqual(0);
    expect(extent[1]).toEqual(0);
    expect(extent[2]).toEqual(1);
    expect(extent[3]).toEqual(2);
  });

  it('should generate a correct OSM format string', () => {
    const expectedResult = '<osm version="0.6" generator="simple-task-dashboard">' +
      '<node id=\'-1\' action=\'modify\' visible=\'true\' lat=\'0\' lon=\'0\' />' +
      '<node id=\'-2\' action=\'modify\' visible=\'true\' lat=\'1\' lon=\'1\' />' +
      '<node id=\'-3\' action=\'modify\' visible=\'true\' lat=\'2\' lon=\'1\' />' +
      '<way id=\'-4\' action=\'modify\' visible=\'true\'>' +
      '<nd ref=\'-1\' />' +
      '<nd ref=\'-2\' />' +
      '<nd ref=\'-3\' />' +
      '<nd ref=\'-1\' />' +
      '</way></osm>';

    const task = new Task('id123', '', 10, 100, TestTaskFeature);

    const osmString = service.getGeometryAsOsm(task);

    console.log('I expect: \n' + expectedResult);
    console.log('I got: \n' + osmString);

    expect(osmString).toEqual(expectedResult);
  });
});
