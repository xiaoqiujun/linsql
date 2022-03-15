import Db from '../src/Db';
// jest.mock('../src/Db')

test('测试jest.fn()调用', () => {
    const connect = Db.connect({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'school',
    })
    connect.query('SELECT * FROM sc_admin')
    let mockFn = jest.fn();
    let result = mockFn(1, 2, 3);
  
    // 断言mockFn的执行后返回undefined
    expect(result).toBeUndefined();
    // 断言mockFn被调用
    expect(mockFn).toBeCalled();
    // 断言mockFn被调用了一次
    expect(mockFn).toBeCalledTimes(1);
    // 断言mockFn传入的参数为1, 2, 3
    expect(mockFn).toHaveBeenCalledWith(1, 2, 3);
  })