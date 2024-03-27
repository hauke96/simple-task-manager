import { TaskService } from './task.service';
import { Task, TaskDto, TestTaskFeature, TestTaskGeometry } from './task.material';
import { Extent } from 'ol/extent';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Polygon } from 'ol/geom';
import { User } from '../user/user.material';
import { UserService } from '../user/user.service';
import { CommentService } from '../comments/comment.service';
import { Comment, CommentDto } from '../comments/comment.material';
import { statsHasErrors } from '@angular-devkit/build-angular/src/tools/webpack/utils/stats';

describe(TaskService.name, () => {
  let service: TaskService;
  let httpClient: HttpClient;
  let userService: UserService;
  let commentService: CommentService;

  beforeEach(() => {
    httpClient = {} as HttpClient;
    userService = {} as UserService;
    commentService = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      toCommentsWithUserMap(dtos: CommentDto[], userMap: Map<string, User>): Comment[] {
        return [] as Comment[];
      }
    } as CommentService;

    service = new TaskService(httpClient, userService, commentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set selected task correctly', () => {
    // Arrange
    const taskChangedSpy = jest.fn();
    service.selectedTaskChanged.subscribe(taskChangedSpy);
    const task = new Task('id123', '', 10, 100, TestTaskFeature, []);

    expect(service.getSelectedTask()).toBeFalsy();

    // Act
    service.selectTask(task);

    // Assert
    expect(service.getSelectedTask()).toEqual(task);
    expect(taskChangedSpy).toHaveBeenCalledWith(task);
  });

  it('should call server on create new task', () => {
    const maxProcessPoints = 100;

    httpClient.post = jest.fn().mockReturnValue(of([new TaskDto('id123', 0, 100, TestTaskGeometry, [])]));
    userService.getUsersByIds = jest.fn().mockReturnValue(of([]));

    let receivedTasks: Task[] = [];
    service.createNewTasks([TestTaskGeometry], maxProcessPoints)
      .subscribe({
        next: (newTasks: Task[]) => receivedTasks = newTasks,
        error: e => fail(e)
      });

    expect(receivedTasks.length).toEqual(1);

    const expectedCoordinated = (TestTaskFeature.getGeometry() as Polygon).getCoordinates();
    const t = receivedTasks[0];
    expect(t).toBeTruthy();
    expect(t.id).toEqual('id123');
    expect((t.geometry.getGeometry() as Polygon).getCoordinates()).toEqual(expectedCoordinated);
    expect(t.maxProcessPoints).toEqual(maxProcessPoints);
    expect(t.processPoints).toEqual(0);
    expect(t.assignedUser).toBeFalsy();
  });

  it('should call server to set process points', () => {
    const newProcessPoints = 50;
    const task = new Task('id123', '', 10, 100, TestTaskFeature, []);
    service.selectTask(task);

    httpClient.post = jest.fn().mockReturnValue(of(new TaskDto('id123', newProcessPoints, 100, TestTaskGeometry, [])));
    userService.getUsersByIds = jest.fn().mockReturnValue(of([]));

    let receivedTask: Task | undefined;
    service.setProcessPoints('id123', newProcessPoints)
      .subscribe({
        next: t => receivedTask = t,
        error: e => fail(e)
      });

    expect(receivedTask).toBeTruthy();
    expect(receivedTask?.processPoints).toEqual(newProcessPoints);
  });

  it('should cancel setting process points when other task selected', () => {
    const newProcessPoints = 50;
    const task = new Task('different-task', '', 10, 100, TestTaskFeature, []);
    service.selectTask(task);

    httpClient.post = jest.fn();

    let hadError = false;
    service.setProcessPoints('id123', newProcessPoints)
      .subscribe({
        next: () => fail('Other task was selected'),
        error: () => {
          hadError = true;
        }
      });

    expect(httpClient.post).not.toHaveBeenCalled();
    expect(hadError).toBeTruthy();
  });

  it('should call server on assign', () => {
    const task = new Task('id123', '', 10, 100, TestTaskFeature, []);
    const userToAssign = 'mapper-dave';
    service.selectTask(task);

    httpClient.post = jest.fn().mockReturnValue(of(new TaskDto('id123', 10, 100, TestTaskGeometry, [], '1')));
    userService.getUsersByIds = jest.fn().mockReturnValue(of([new User(userToAssign, '1')]));

    let receivedTask: Task | undefined;
    service.assign('id123')
      .subscribe({
        next: (t: Task | undefined) => receivedTask = t,
        error: e => fail(e)
      });

    expect(receivedTask).not.toBeUndefined();
    expect(receivedTask?.assignedUser).toBeTruthy();
    expect(receivedTask?.assignedUser?.uid).toEqual('1');
    expect(receivedTask?.assignedUser?.name).toEqual(userToAssign);
  });

  it('should abort assign when other task selected', () => {
    const task = new Task('different-id', '', 10, 100, TestTaskFeature, []);
    httpClient.post = jest.fn();

    service.selectTask(task);

    let hadError = false;
    service.assign('id123')
      .subscribe({
        next: () => fail('Other task was selected'),
        error: () => hadError = true
      });

    expect(httpClient.post).not.toHaveBeenCalled();
    expect(hadError).toBeTruthy();
  });

  it('should call server on unassign', () => {
    const userToUnassign = 'mapper-dave';
    const task = new Task('id123', '', 10, 100, TestTaskFeature, [], new User(userToUnassign, '2'));
    service.selectTask(task);

    httpClient.delete = jest.fn().mockReturnValue(of(new TaskDto('id123', 10, 100, TestTaskGeometry, [])));
    userService.getUsersByIds = jest.fn().mockReturnValue(of([new User(userToUnassign, '2')]));

    let receivedTask: Task | undefined;
    service.unassign('id123')
      .subscribe({
        next: t => receivedTask = t,
        error: e => fail(e)
      });

    expect(receivedTask).toBeTruthy();
    expect(receivedTask?.assignedUser).toEqual(undefined);
  });

  it('should abort unassign when other task selected', () => {
    const userToUnassign = 'mapper-dave';
    const task = new Task('different-id', '', 10, 100, TestTaskFeature, [], new User(userToUnassign, '2'));
    httpClient.post = jest.fn();

    service.selectTask(task);

    let hadError = false;
    service.unassign('id123')
      .subscribe({
        next: () => fail('Other task was selected'),
        error: () => hadError = true
      });

    expect(httpClient.post).not.toHaveBeenCalled();
    expect(hadError).toBeTruthy();
  });

  it('should calculate the extent correctly', () => {
    const task = new Task('id123', '', 10, 100, TestTaskFeature, []);

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

    const task = new Task('id123', '', 10, 100, TestTaskFeature, []);

    const osmString = service.getGeometryAsOsm(task);

    console.log('I expect: \n' + expectedResult);
    console.log('I got: \n' + osmString);

    expect(osmString).toEqual(expectedResult);
  });
});
