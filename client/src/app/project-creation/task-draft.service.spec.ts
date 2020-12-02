import { TestBed } from '@angular/core/testing';

import { TaskDraftService } from './task-draft.service';
import { Polygon } from 'ol/geom';
import { TaskDraft } from '../task/task.material';

describe('TaskDraftService', () => {
  let service: TaskDraftService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskDraftService]
    });
    service = TestBed.inject(TaskDraftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add task IDs correctly', () => {
    const spy = spyOn(service.tasksAdded, 'emit');

    const tasks: TaskDraft[] = [];
    tasks.push(createTaskDraftById({id: 10}));
    tasks.push(createTaskDraftById({id: '5'}));
    tasks.push(createTaskDraftById({id: 'one'}));
    tasks.push(createTaskDraftById({id: '   '}));
    tasks.push(createTaskDraftById({id: null}));
    tasks.push(createTaskDraftById({id: undefined}));
    tasks.push(createTaskDraftById());
    tasks.push(createTaskDraftById({id: 0}));
    tasks.push(createTaskDraftById({id: -1}));
    tasks.push(createTaskDraftById({id: 5.123}));
    tasks.push(createTaskDraftById({id: false}));
    tasks.push(createTaskDraftById({id: true}));
    tasks.push(createTaskDraftById({id: []}));
    tasks.push(createTaskDraftById({id: {}}));

    service.addTasks(tasks);

    const addedShapes = spy.calls.first().args[0] as TaskDraft[];
    expect(addedShapes.length).toEqual(tasks.length);
    expect(addedShapes.map(f => f.id)).toContain('10');
    expect(addedShapes.map(f => f.id)).toContain('5');
    expect(addedShapes.map(f => f.id)).toContain('1'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('2'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('3'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('4'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('6'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('0');
    expect(addedShapes.map(f => f.id)).toContain('7'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('8'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('9'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('11'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('12'); // generated ID
    expect(addedShapes.map(f => f.id)).toContain('13'); // generated ID
  });

  it('should add task name correctly', () => {
    const spy = spyOn(service.tasksAdded, 'emit');

    const tasks: TaskDraft[] = [];
    tasks.push(createTaskDraftById({id: 0}));
    tasks.push(createTaskDraftById({id: 1, name: ''}));
    tasks.push(createTaskDraftById({id: 2, name: undefined}));
    tasks.push(createTaskDraftById({id: 3, name: null}));
    tasks.push(createTaskDraftById({id: 4, name: 'foo'}));

    service.addTasks(tasks);

    const addedShapes = spy.calls.first().args[0] as TaskDraft[];
    expect(addedShapes.length).toEqual(tasks.length);
    expect(addedShapes[0].name).toContain('0');
    expect(addedShapes[1].name).toContain('1');
    expect(addedShapes[2].name).toContain('2');
    expect(addedShapes[3].name).toContain('3');
    expect(addedShapes[4].name).toContain('foo');
  });

  it('should determine smallest ID correctly', () => {
    const tasks: TaskDraft[] = [];
    tasks.push(createTaskDraftById({id: 10}));
    tasks.push(createTaskDraftById({id: -1}));
    tasks.push(createTaskDraftById({id: 0}));
    tasks.push(createTaskDraftById({id: '5'}));
    tasks.push(createTaskDraftById({id: 1}));
    tasks.push(createTaskDraftById({id: 3}));

    // @ts-ignore
    const smallestId = service.findSmallestId(tasks);

    expect(smallestId).toEqual('2');
  });

  it('should sort tasks correctly', () => {
    const tasks: TaskDraft[] = [];
    tasks.push(createTaskDraftById({id: 10}));
    tasks.push(createTaskDraftById({id: '5'}));
    tasks.push(createTaskDraftById({id: 'one'}));
    tasks.push(createTaskDraftById({id: '   '}));
    tasks.push(createTaskDraftById({id: null}));
    tasks.push(createTaskDraftById({id: undefined}));
    tasks.push(createTaskDraftById());
    tasks.push(createTaskDraftById({id: 0}));
    tasks.push(createTaskDraftById({id: -1}));
    tasks.push(createTaskDraftById({id: 5.123}));
    tasks.push(createTaskDraftById({id: false}));
    tasks.push(createTaskDraftById({id: true}));
    tasks.push(createTaskDraftById({id: []}));
    tasks.push(createTaskDraftById({id: {}}));

    // @ts-ignore
    const sortedTasks = service.sortTasksById(tasks);

    expect(sortedTasks.length).toEqual(3);
    expect(sortedTasks[0]).toEqual(tasks[7]);
    expect(sortedTasks[1]).toEqual(tasks[1]);
    expect(sortedTasks[2]).toEqual(tasks[0]);
  });

  it('should return tasks', () => {
    expect(service.getTasks()).toEqual([]);

    const tasks = [new TaskDraft('123', 'some name', new Polygon([]))];
    // @ts-ignore
    service.tasks = tasks;
    expect(service.getTasks()).toEqual(tasks);
  });

  it('should select task correctly and fire event', () => {
    expect(service.getSelectedTask()).toEqual(undefined);

    const spyEvent = spyOn(service.taskSelected, 'emit');
    const tasks = [
      new TaskDraft('1', 'some name', new Polygon([])),
      new TaskDraft('123', 'some name', new Polygon([])),
      new TaskDraft('238754', 'some name', new Polygon([]))
    ];
    // @ts-ignore
    service.tasks = tasks;
    service.selectTask('123');

    expect(service.getSelectedTask().id).toEqual('123');
    expect(spyEvent).toHaveBeenCalled();
  });

  it('should not select anything on unknown task id', () => {
    expect(service.getSelectedTask()).toEqual(undefined);

    const spyEvent = spyOn(service.taskSelected, 'emit');
    const tasks = [
      new TaskDraft('1', 'some name', new Polygon([])),
      new TaskDraft('123', 'some name', new Polygon([])),
      new TaskDraft('238754', 'some name', new Polygon([]))
    ];
    // @ts-ignore
    service.tasks = tasks;
    service.selectTask('999999');

    expect(service.getSelectedTask()).toEqual(undefined);
    expect(spyEvent).not.toHaveBeenCalled();
  });

  it('should remove existing task', () => {
    const spyEvent = spyOn(service.taskRemoved, 'emit');
    const tasks = [
      new TaskDraft('1', 'some name', new Polygon([])),
      new TaskDraft('123', 'some name', new Polygon([])),
      new TaskDraft('238754', 'some name', new Polygon([]))
    ];
    // @ts-ignore
    service.tasks = tasks;

    service.removeTask('123');

    expect(service.getTasks().map(t => t.id)).not.toContain('123');
    expect(spyEvent).toHaveBeenCalled();
  });

  it('should deselect removed task', () => {
    const tasks = [
      new TaskDraft('1', 'some name', new Polygon([])),
      new TaskDraft('123', 'some name', new Polygon([])),
      new TaskDraft('238754', 'some name', new Polygon([]))
    ];
    // @ts-ignore
    service.tasks = tasks;
    // @ts-ignore
    service.selectedTask = tasks[1];

    service.removeTask('123');

    expect(service.getSelectedTask()).toEqual(undefined);
  });

  it('should rename task correctly', () => {
    const spyEvent = spyOn(service.taskChanged, 'emit');
    const tasks = [
      new TaskDraft('123', 'some name', new Polygon([])),
    ];
    // @ts-ignore
    service.tasks = tasks;

    service.changeTaskName('123', 'new name');

    expect(service.getTasks()[0].name).toEqual('new name');
    expect(spyEvent).toHaveBeenCalledWith(tasks[0]);
  });

  it('should also rename selected task correctly', () => {
    const spyEvent = spyOn(service.taskChanged, 'emit');
    const tasks = [
      new TaskDraft('123', 'some name', new Polygon([])),
    ];
    // @ts-ignore
    service.tasks = tasks;
    // @ts-ignore
    service.selectTask('123');

    service.changeTaskName('123', 'new name');

    expect(service.getSelectedTask().name).toEqual('new name');
    expect(spyEvent).toHaveBeenCalledWith(tasks[0]);
  });

  function createTaskDraftById(props?: any): TaskDraft {
    return new TaskDraft(props?.id, props?.name, new Polygon([[[0, 0], [1000, 1000], [2000, 0], [0, 0]]]));
  }
});
