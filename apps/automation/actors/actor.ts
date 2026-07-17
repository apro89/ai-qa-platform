import type { Ability } from '@automation/abilities/ability.js';

export interface Performable {
  performAs(actor: Actor): Promise<void>;
}

export interface Question<T> {
  answeredBy(actor: Actor): Promise<T>;
}

export class Actor {
  private readonly abilities = new Map<string, Ability>();

  private constructor(readonly name: string) {}

  static named(name: string): Actor {
    return new Actor(name);
  }

  whoCan(...abilities: Ability[]): this {
    abilities.forEach((ability) => this.abilities.set(ability.name, ability));
    return this;
  }

  abilityTo<T extends Ability>(abilityName: string): T {
    const ability = this.abilities.get(abilityName);
    if (!ability) throw new Error(`${this.name} does not have the ${abilityName} ability.`);
    return ability as T;
  }

  attemptsTo(...activities: Performable[]): Promise<void> {
    return activities.reduce(async (previous, activity) => {
      await previous;
      await activity.performAs(this);
    }, Promise.resolve());
  }

  asks<T>(question: Question<T>): Promise<T> {
    return question.answeredBy(this);
  }
}
