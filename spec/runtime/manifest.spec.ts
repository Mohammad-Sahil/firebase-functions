import { expect } from 'chai';
import { ManifestStack, stackToWire } from '../../src/runtime/manifest';
import * as params from '../../src/v2/params';

describe('stackToWire', () => {
  afterEach(() => {
    params.clearParams();
  });

  it('converts stack with null values values', () => {
    const stack: ManifestStack = {
      endpoints: {
        v2http: {
          platform: 'gcfv2',
          entryPoint: 'v2http',
          labels: {},
          httpsTrigger: {},
          maxInstances: null,
        },
      },
      requiredAPIs: [],
      specVersion: 'v1alpha1',
    };
    const expected = {
      endpoints: {
        v2http: {
          platform: 'gcfv2',
          entryPoint: 'v2http',
          labels: {},
          httpsTrigger: {},
          maxInstances: null,
        },
      },
      requiredAPIs: [],
      specVersion: 'v1alpha1',
    };
    expect(stackToWire(stack)).to.deep.equal(expected);
  });

  it('converts Expression types in endpoint options to CEL', () => {
    const intParam = params.defineInt('foo', { default: 11 });
    const stringParam = params.defineString('bar', {
      default: 'America/Los_Angeles',
    });

    const stack: ManifestStack = {
      endpoints: {
        v2http: {
          platform: 'gcfv2',
          entryPoint: 'v2http',
          labels: {},
          httpsTrigger: {},
          concurrency: intParam,
          maxInstances: intParam.equals(24).then(-1, 1),
        },
        v2schedule: {
          platform: 'gcfv2',
          entryPoint: 'v2callable',
          labels: {},
          scheduleTrigger: {
            schedule: stringParam
              .equals('America/Mexico_City')
              .then('mexico', 'usa'),
            timeZone: stringParam,
          },
        },
      },
      requiredAPIs: [],
      specVersion: 'v1alpha1',
    };
    const expected = {
      endpoints: {
        v2http: {
          platform: 'gcfv2',
          entryPoint: 'v2http',
          labels: {},
          httpsTrigger: {},
          concurrency: '{{ params.foo }}',
          maxInstances: '{{ params.foo == 24 ? -1 : 1 }}',
        },
        v2schedule: {
          platform: 'gcfv2',
          entryPoint: 'v2callable',
          labels: {},
          scheduleTrigger: {
            schedule:
              '{{ params.bar == "America/Mexico_City" ? "mexico" : "usa" }}',
            timeZone: '{{ params.bar }}',
          },
        },
      },
      requiredAPIs: [],
      specVersion: 'v1alpha1',
    };
    expect(stackToWire(stack)).to.deep.equal(expected);
  });
});
