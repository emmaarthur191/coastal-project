# Generated manually for security hardening

from django.db import migrations, models

def create_audit_log_trigger(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute("""
            CREATE OR REPLACE FUNCTION block_audit_log_mutation()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'Audit log entries are immutable and cannot be updated or deleted.';
            END;
            $$ LANGUAGE plpgsql;
        """)
        schema_editor.execute("DROP TRIGGER IF EXISTS audit_log_no_update_delete ON audit_log;")
        schema_editor.execute("""
            CREATE TRIGGER audit_log_no_update_delete
            BEFORE UPDATE OR DELETE ON audit_log
            FOR EACH ROW EXECUTE FUNCTION block_audit_log_mutation();
        """)
    elif schema_editor.connection.vendor == 'sqlite':
        schema_editor.execute("DROP TRIGGER IF EXISTS audit_log_no_update;")
        schema_editor.execute("""
            CREATE TRIGGER audit_log_no_update
            BEFORE UPDATE ON audit_log
            WHEN bypass_audit_trigger() = 0
            BEGIN
                SELECT RAISE(FAIL, 'Audit log entries are immutable and cannot be updated.');
            END;
        """)
        schema_editor.execute("DROP TRIGGER IF EXISTS audit_log_no_delete;")
        schema_editor.execute("""
            CREATE TRIGGER audit_log_no_delete
            BEFORE DELETE ON audit_log
            WHEN bypass_audit_trigger() = 0
            BEGIN
                SELECT RAISE(FAIL, 'Audit log entries are immutable and cannot be deleted.');
            END;
        """)

def drop_audit_log_trigger(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        schema_editor.execute("DROP TRIGGER IF EXISTS audit_log_no_update_delete ON audit_log;")
        schema_editor.execute("DROP FUNCTION IF EXISTS block_audit_log_mutation();")
    elif schema_editor.connection.vendor == 'sqlite':
        schema_editor.execute("DROP TRIGGER IF EXISTS audit_log_no_update;")
        schema_editor.execute("DROP TRIGGER IF EXISTS audit_log_no_delete;")

class Migration(migrations.Migration):

    dependencies = [
        ("core", "0071_expand_report_type_choices"),
        ("users", "0021_alter_adminnotification_table_alter_auditlog_table_and_more"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="accountopeningrequest",
            constraint=models.CheckConstraint(
                check=models.Q(approved_by__isnull=True) | ~models.Q(approved_by=models.F('submitted_by')),
                name="opening_request_maker_checker_distinct",
            ),
        ),
        migrations.AddConstraint(
            model_name="accountclosurerequest",
            constraint=models.CheckConstraint(
                check=models.Q(approved_by__isnull=True) | ~models.Q(approved_by=models.F('submitted_by')),
                name="closure_request_maker_checker_distinct",
            ),
        ),
        migrations.AddConstraint(
            model_name="transaction",
            constraint=models.CheckConstraint(
                check=models.Q(approved_by__isnull=True) | ~models.Q(approved_by=models.F('processed_by')),
                name="transaction_maker_checker_distinct",
            ),
        ),
        migrations.RunPython(
            create_audit_log_trigger,
            drop_audit_log_trigger,
        ),
    ]
