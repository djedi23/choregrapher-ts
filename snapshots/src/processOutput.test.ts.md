# Snapshot report for `src/processOutput.test.ts`

The actual snapshot is saved in `processOutput.test.ts.snap`.

Generated by [AVA](https://ava.li).

## one output to one input

> updateOne 1 -> 1

    {
      collection: 'runs',
      filter: {
        processId: '453',
      },
      option: undefined,
      update: {
        $push: {
          outputs: {
            context: {},
            output: {
              node: 'node',
              output: 'o',
            },
            parameter: 5,
            processId: '453',
            timestamp: Date 2018-08-18 04:51:30 123ms UTC {},
          },
        },
      },
    }

> sendMessage 1 -> 1

    {
      graphId: 'graph1',
      key: 'flow.node2_b',
      obj: {
        context: {},
        parameter: {
          b: 5,
        },
        processId: '453',
      },
    }

## one output to one input (input as object)

> updateOne 1 -> 1 (o)

    {
      collection: 'runs',
      filter: {
        processId: '453',
      },
      option: undefined,
      update: {
        $push: {
          outputs: {
            context: {},
            output: {
              node: 'node',
              output: 'o',
            },
            parameter: 5,
            processId: '453',
            timestamp: Date 2018-08-18 04:51:30 123ms UTC {},
          },
        },
      },
    }

> sendMessage 1 -> 1 (o)

    {
      graphId: 'graph1',
      key: 'flow.node2_b',
      obj: {
        context: {},
        parameter: {
          b: 5,
        },
        processId: '453',
      },
    }

## one output to two inputs in two nodes

> updateOne 1 -> 2

    {
      collection: 'runs',
      filter: {
        processId: '453',
      },
      option: undefined,
      update: {
        $push: {
          outputs: {
            context: {},
            output: {
              node: 'node',
              output: 'o',
            },
            parameter: 5,
            processId: '453',
            timestamp: Date 2018-08-18 04:51:30 123ms UTC {},
          },
        },
      },
    }

> sendMessage 1 -> 2

    {
      graphId: 'graph1',
      key: 'flow.node2_b',
      obj: {
        context: {},
        parameter: {
          b: 5,
        },
        processId: '453',
      },
    }

> sendMessage 1 -> 2

    {
      graphId: 'graph1',
      key: 'flow.node3_c',
      obj: {
        context: {},
        parameter: {
          c: 5,
        },
        processId: '453',
      },
    }

## transient input

> updateOne 1 -> 1 transient input

    {
      collection: 'runs',
      filter: {
        processId: '453',
      },
      option: undefined,
      update: {
        $push: {
          outputs: {
            context: {},
            output: {
              node: 'node',
              output: 'o',
            },
            parameter: 5,
            processId: '453',
            timestamp: Date 2018-08-18 04:51:30 123ms UTC {},
          },
        },
      },
    }

## two outputs to two inputs in two nodes

> updateOne 2 -> 2

    {
      collection: 'runs',
      filter: {
        processId: '453',
      },
      option: undefined,
      update: {
        $push: {
          outputs: {
            context: {},
            output: {
              node: 'node',
              output: 'o1',
            },
            parameter: 5,
            processId: '453',
            timestamp: Date 2018-08-18 04:51:30 123ms UTC {},
          },
        },
      },
    }

> updateOne 2 -> 2

    {
      collection: 'runs',
      filter: {
        processId: '453',
      },
      option: undefined,
      update: {
        $push: {
          outputs: {
            context: {},
            output: {
              node: 'node',
              output: 'o2',
            },
            parameter: 8,
            processId: '453',
            timestamp: Date 2018-08-18 04:51:30 123ms UTC {},
          },
        },
      },
    }

> sendMessage 2 -> 2

    {
      graphId: 'graph1',
      key: 'flow.node2_b',
      obj: {
        context: {},
        parameter: {
          b: 5,
        },
        processId: '453',
      },
    }

> sendMessage 2 -> 2

    {
      graphId: 'graph1',
      key: 'flow.node3_c',
      obj: {
        context: {},
        parameter: {
          c: 8,
        },
        processId: '453',
      },
    }