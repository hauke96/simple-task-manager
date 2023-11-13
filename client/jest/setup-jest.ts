import 'jest-preset-angular/setup-jest';

window.URL.createObjectURL = () => '';

// Mock the RBush for OpenLayers. Otherwise, the RBush constructor is somehow unavailable.
jest.mock('ol/structs/RBush');

window.fail = (reason: any) => {
  throw new Error(reason);
};

window.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
