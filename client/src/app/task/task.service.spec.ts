import { TestBed } from '@angular/core/testing';

import { TaskService } from './task.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Task } from './task.material';
import { Extent } from 'ol/extent';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';

describe('TaskService', () => {
  let service: TaskService;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpClient = TestBed.inject(HttpClient);
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set selected task correctly', () => {
    const spy = spyOn(service.selectedTaskChanged, 'emit');
    const task = new Task('id123', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]]);

    expect(service.getSelectedTask()).toBeFalsy();

    service.selectTask(task);

    expect(service.getSelectedTask()).toEqual(task);
    expect(spy).toHaveBeenCalledWith(task);
  });

  it('should call server on create new task', () => {
    const geometry: [number, number][] = [[0, 0], [100, 100], [200, 0], [0, 0]];
    const maxProcessPoints = 100;

    spyOn(httpClient, 'post').and.returnValue(
      of([new Task('id123', 0, maxProcessPoints, geometry)])
    );

    service.createNewTasks([geometry], maxProcessPoints)
      .subscribe((newTasks: Task[]) => {
          expect(newTasks.length).toEqual(1);

          const t = newTasks[0];
          expect(t.id).toEqual('id123');
          expect(t.geometry).toEqual(geometry);
          expect(t.maxProcessPoints).toEqual(maxProcessPoints);
          expect(t.processPoints).toEqual(0);
          expect(t.assignedUser).toBeFalsy();
        },
        error => fail());
  });

  it('should call server to set process points', () => {
    const newProcessPoints = 50;
    const task = new Task('id123', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]]);
    service.selectTask(task);

    spyOn(httpClient, 'post').and.returnValue(
      of(new Task('id123', newProcessPoints, 100, [[0, 0], [100, 100], [200, 0], [0, 0]]))
    );

    service.setProcessPoints('id123', newProcessPoints);
    // TODO check return value when implemented
  });

  it('should cancel when other task selected', () => {
    const newProcessPoints = 50;
    const task = new Task('different-task', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]]);
    service.selectTask(task);

    const spy = spyOn(httpClient, 'post');

    service.selectTask(task);
    try {
      service.setProcessPoints('id123', newProcessPoints);

      // This operation should throw an error
      fail();
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  it('should call server on assign', () => {
    const task = new Task('id123', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]]);
    const userToAssign = 'mapper-dave';
    service.selectTask(task);

    spyOn(httpClient, 'post').and.returnValue(
      of(new Task('id123', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]], userToAssign))
    );

    service.assign('id123', userToAssign);
    // TODO check return value when implemented
  });

  it('should abort assign when other task selected', () => {
    const task = new Task('different-id', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]]);
    const userToAssign = 'mapper-dave';
    const spy = spyOn(httpClient, 'post');

    service.selectTask(task);
    try {
      service.assign('id123', userToAssign);

      // This operation should throw an error
      fail();
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  it('should call server on unassign', () => {
    const userToUnassign = 'mapper-dave';
    const task = new Task('id123', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]], userToUnassign);
    service.selectTask(task);

    spyOn(httpClient, 'post').and.returnValue(
      of(new Task('id123', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]]))
    );

    service.unassign('id123');
    // TODO check return value when implemented
  });

  it('should abort unassign when other task selected', () => {
    const userToUnassign = 'mapper-dave';
    const task = new Task('different-id', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]], userToUnassign);
    const spy = spyOn(httpClient, 'post');

    service.selectTask(task);
    try {
      service.unassign('id123');

      // This operation should throw an error
      fail();
    } catch (e) {
      expect(spy).not.toHaveBeenCalled();
    }
  });

  it('should calculate the extent correctly', () => {
    const task = new Task('id123', 10, 100, [[0, 0], [100, 100], [200, 0], [0, 0]]);

    const extent: Extent = service.getExtent(task);

    expect(extent[0]).toEqual(0);
    expect(extent[1]).toEqual(0);
    expect(extent[2]).toEqual(200);
    expect(extent[3]).toEqual(100);
  });

  it('should generate a correct OSM format string', () => {
    const expectedResult = '<osm version="0.6" generator="simple-task-manager">' +
      '<node id=\'-1\' action=\'modify\' visible=\'true\' lat=\'0\' lon=\'0\' />' +
      '<node id=\'-2\' action=\'modify\' visible=\'true\' lat=\'2\' lon=\'1\' />' +
      '<node id=\'-3\' action=\'modify\' visible=\'true\' lat=\'0\' lon=\'2\' />' +
      '<way id=\'-4\' action=\'modify\' visible=\'true\'>' +
      '<nd ref=\'-1\' />' +
      '<nd ref=\'-2\' />' +
      '<nd ref=\'-3\' />' +
      '<nd ref=\'-1\' />' +
      '</way></osm>';

    const task = new Task('id123', 10, 100, [[0, 0], [1, 2], [2, 0]]);

    const osmString = service.getGeometryAsOsm(task);

    console.log('I expect: \n' + expectedResult);
    console.log('I got: \n' + osmString);

    expect(osmString).toEqual(expectedResult);
  });
});
