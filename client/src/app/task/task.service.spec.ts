import { TestBed } from '@angular/core/testing';

import { TaskService } from './task.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Task, TaskDto, TestTaskFeature, TestTaskGeometry } from './task.material';
import { Extent } from 'ol/extent';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { Polygon } from 'ol/geom';
import { User } from '../user/user.material';
import { UserService } from '../user/user.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpClient: HttpClient;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpClient = TestBed.inject(HttpClient);
    service = TestBed.inject(TaskService);
    userService = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set selected task correctly', () => {
    const spy = spyOn(service.selectedTaskChanged, 'emit');
    const task = new Task('id123', '', 10, 100, TestTaskFeature);

    expect(service.getSelectedTask()).toBeFalsy();

    service.selectTask(task);

    expect(service.getSelectedTask()).toEqual(task);
    expect(spy).toHaveBeenCalledWith(task);
  });

  it('should call server on create new task', () => {
    const maxProcessPoints = 100;

    spyOn(httpClient, 'post').and.returnValue(
      of([new TaskDto('id123', 0, 100, TestTaskGeometry)])
    );

    service.createNewTasks([TestTaskGeometry], maxProcessPoints)
      .subscribe((newTasks: Task[]) => {
          expect(newTasks.length).toEqual(1);

          const expectedCoordinated = (TestTaskFeature.getGeometry() as Polygon).getCoordinates();

          const t = newTasks[0];
          expect(t).toBeTruthy();
          expect(t.id).toEqual('id123');
          expect((t.geometry.getGeometry() as Polygon).getCoordinates()).toEqual(expectedCoordinated);
          expect(t.maxProcessPoints).toEqual(maxProcessPoints);
          expect(t.processPoints).toEqual(0);
          expect(t.assignedUser).toBeFalsy();
        },
        e => fail(e));
  });

  it('should call server to set process points', () => {
    const newProcessPoints = 50;
    const task = new Task('id123', '', 10, 100, TestTaskFeature);
    service.selectTask(task);

    spyOn(httpClient, 'post').and.returnValue(
      of(new TaskDto('id123', newProcessPoints, 100, TestTaskGeometry))
    );

    service.setProcessPoints('id123', newProcessPoints)
      .subscribe(
        t => {
          expect(t).toBeTruthy();
          expect(t.processPoints).toEqual(newProcessPoints);
        },
        e => fail(e));
  });

  it('should cancel setting process points when other task selected', () => {
    const newProcessPoints = 50;
    const task = new Task('different-task', '', 10, 100, TestTaskFeature);
    service.selectTask(task);

    const spy = spyOn(httpClient, 'post');

    service.setProcessPoints('id123', newProcessPoints)
      .subscribe(
        t => fail('Other task was selected'),
        () => expect(spy).not.toHaveBeenCalled());
  });

  it('should call server on assign', () => {
    const task = new Task('id123', '', 10, 100, TestTaskFeature);
    const userToAssign = 'mapper-dave';
    service.selectTask(task);

    spyOn(httpClient, 'post').and.returnValue(
      of(new TaskDto('id123', 10, 100, TestTaskGeometry, '1'))
    );
    spyOn(userService, 'getUsersByIds').and.returnValue(of([new User(userToAssign, '1')]));

    service.assign('id123')
      .subscribe(
        (t: Task | undefined) => {
          console.log(t);
          expect(t).not.toEqual(undefined);
          expect(t?.assignedUser).toBeTruthy();
          expect(t?.assignedUser?.uid).toEqual('1');
          expect(t?.assignedUser?.name).toEqual(userToAssign);
        },
        e => fail(e));
  });

  it('should abort assign when other task selected', () => {
    const task = new Task('different-id', '', 10, 100, TestTaskFeature);
    const spy = spyOn(httpClient, 'post');

    service.selectTask(task);

    service.assign('id123')
      .subscribe(
        () => fail('Other task was selected'),
        () => expect(spy).not.toHaveBeenCalled());
  });

  it('should call server on unassign', () => {
    const userToUnassign = 'mapper-dave';
    const task = new Task('id123', '', 10, 100, TestTaskFeature, new User(userToUnassign, '2'));
    service.selectTask(task);

    spyOn(httpClient, 'post').and.returnValue(
      of(new TaskDto('id123', 10, 100, TestTaskGeometry))
    );

    service.unassign('id123')
      .subscribe(
        t => {
          expect(t).toBeTruthy();
          expect(t.assignedUser).toEqual(undefined);
        },
        e => fail(e));
  });

  it('should abort unassign when other task selected', () => {
    const userToUnassign = 'mapper-dave';
    const task = new Task('different-id', '', 10, 100, TestTaskFeature, new User(userToUnassign, '2'));
    const spy = spyOn(httpClient, 'post');

    service.selectTask(task);

    service.unassign('id123')
      .subscribe(
        t => fail('Other task was selected'),
        () => expect(spy).not.toHaveBeenCalled());
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
    const expectedResult = '<osm version="0.6" generator="simple-task-manager">' +
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
