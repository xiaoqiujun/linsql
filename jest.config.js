
module.exports = {
    roots: [
        "<rootDir>/test"
    ],
    testRegex: 'test/.*\\.(test)\\.(ts)$',
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    "collectCoverageFrom": [
        "src/*.{js,ts}",
        "src/**/*.{js,ts}"
    ]
};