db.graph.insertMany([
  {
    id: 'fact',
    version:'1.0.0',
    createdAt: new Date(),
    modifiedAt: new Date(),
    nodes: [
      {
        id: 'fact',
        name: 'fact',
        input: ['i'],
        output: ['o', 'r'],
      },
    ],
    edges: [
      {
        from: { node: 'start', output: 'i' },
        to: { node: 'fact', input: 'i' },
      },
      {
        from: { node: 'fact', output: 'o' },
        to: { node: 'fact', input: 'i' },
      },
    ],
  },
  {
    id: 'fact_map',
    version:'1.0.0',
    createdAt: new Date(),
    modifiedAt: new Date(),
   startingParameters: {
        i: {
            type: 'array',
            items: {
                type: 'number'
            }
        }
    },    nodes: [
      { id: 'map', name:'map', input: ['i'], output: ['i'] },
      {
        id: 'join',
        name: 'join',
        input: ['i'],
        output: ['i'],
      },
      {
        id: 'dump',
        name: 'dump',
        input: ['i'],
        output: [],
      },
      {
        id: 'fact',
        name: 'fact',
        input: ['i'],
        output: ['o', 'r'],
      },
    ],
    edges: [
      {
        from: { node: 'start', output: 'i' },
        to: { node: 'map', input: 'i' },
      },
      {
        from: { node: 'map', output: 'i' },
        to: { node: 'fact', input: 'i' },
      },
      {
        from: { node: 'fact', output: 'r' },
        to: { node: 'join', input: 'i' },
      },
      {
        from: { node: 'fact', output: 'o' },
        to: { node: 'fact', input: 'i' },
      },
      {
        from: { node: 'join', output: 'i' },
        to: { node: 'dump', input: 'i' },
      },
    ],
  },
]);
