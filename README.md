# Tokens Library

A TypeScript utility library providing common functions, type guards, validators, decorators, and entity management tools.

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Usage Examples](#usage-examples)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
dx install @zeeerotn/tokens
```

## Features

### Common Utilities
- **Guards** - Type checking utilities
- **Services** - Helper classes for common operations
- **Annotations** - Class and method decorators
- **Entity Management** - Base entity implementation
- **Validation System** - Extensible validation framework

### Directory Structure

```
src/
├── common/      # Core utilities and helpers
├── decorator/   # Decorator implementation
├── entity/      # Entity management
└── validator/   # Validation framework
```

## Usage Examples

### Type Guards

```typescript
import { isString, isNumber, isArray } from '@zeeerotn/tokens/common/guards';

const value = "test";
if (isString(value)) {
    // Handle string case
}
```

### Entity Management

```typescript
import { Entity } from '@zeeerotn/tokens/entity/services';

class User extends Entity {
    firstName: string;
    lastName: string;
}
```

### Validation

```typescript
import { Integer, Required } from '@zeeerotn/tokens/validator/validations';

class UserValidator {
    @Integer()
    id: number;

    @Required()
    name: string;
}
```

### Decorators

```typescript
import { Debug, Singleton } from '@zxxxro/tokens/common/annotations';

@Singleton()
@Debug()
class MyService {
    // Service implementation
}
```

## API Documentation

### Common Guards

| Guard | Description |
|-------|-------------|
| isArray | Checks if value is an array |
| isBigInt | Checks if value is a BigInt |
| isBoolean | Checks if value is a boolean |
| isDate | Checks if value is a Date object |
| isNumber | Checks if value is a number |
| isString | Checks if value is a string |
| isObject | Checks if value is an object |
| isNull | Checks if value is null |
| isUndefined | Checks if value is undefined |

### Validation Types

| Validator | Description |
|-----------|-------------|
| Equal | Checks for equality |
| Float | Validates float numbers |
| Integer | Validates integer numbers |
| GreaterThan | Checks if value is greater |
| LessThan | Checks if value is less |
| Regex | Pattern matching validation |
| Required | Checks for required fields |

### Services

| Service | Description |
|---------|-------------|
| Artifactor | Artifact management |
| Common | Common utilities |
| Factory | Object factory implementation |
| List | List management |
| Metadata | Metadata handling |
| Objector | Object manipulation |
| Text | Text processing utilities |

### Decorators

| Decorator | Description |
|-----------|-------------|
| Debug | Adds debug logging |
| Mixin | Implements mixin pattern |
| Singleton | Ensures single instance |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file
