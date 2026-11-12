import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1794512103204 implements MigrationInterface {
    name = 'InitSchema1794512103204'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "registrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "event_id" uuid NOT NULL, "registered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_registrations_user_event" UNIQUE ("user_id", "event_id"), CONSTRAINT "PK_6013e724d7b22929da9cd7282d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c082d66f7080c743a96c1e9180" ON "registrations"  ("event_id") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "full_name" character varying NOT NULL, "password_hash" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(150) NOT NULL, "description" text NOT NULL, "location" character varying(200) NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "capacity" integer NOT NULL, "owner_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_904b41f134489faef83130a212" CHECK ("capacity" > 0), CONSTRAINT "CHK_43b3f32587bff9a13e07b0443b" CHECK ("ends_at" > "starts_at"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_da080c835c9fc4e0aa5e8fe264" ON "events"  ("starts_at") `);
        await queryRunner.query(`ALTER TABLE "registrations" ADD CONSTRAINT "FK_6aacc9b213fd8c881af6c738ecf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD CONSTRAINT "FK_c082d66f7080c743a96c1e91807" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_918130b4f882fda431503d6f4e0" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_918130b4f882fda431503d6f4e0"`);
        await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_c082d66f7080c743a96c1e91807"`);
        await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_6aacc9b213fd8c881af6c738ecf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da080c835c9fc4e0aa5e8fe264"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c082d66f7080c743a96c1e9180"`);
        await queryRunner.query(`DROP TABLE "registrations"`);
    }

}
