import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import semver from 'semver';

@ValidatorConstraint({ async: false })
export class IsExampleCRMSemVerValidator implements ValidatorConstraintInterface {
  validate(version: string) {
    const parsed = semver.parse(version);

    return parsed !== null;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid semantic version (e.g., 1.0.0)`;
  }
}

export const IsExampleCRMSemVer =
  (validationOptions?: ValidationOptions) =>
  (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsExampleCRMSemVerValidator,
    });
  };
