module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true,
    },
    "overrides": [
        {
            "env": {
                "node": true,
                "es6": true,
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "rules": {
        "no-useless-escape": "off"
    }
}
