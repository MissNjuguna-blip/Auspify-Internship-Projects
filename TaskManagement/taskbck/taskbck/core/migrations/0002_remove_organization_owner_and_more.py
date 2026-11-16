
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        # Remove unique constraints BEFORE removing their fields.
        migrations.RemoveConstraint(
            model_name='organizationmember',
            name='unique_organization_member',
        ),
        migrations.RemoveConstraint(
            model_name='projectmember',
            name='unique_project_member',
        ),
        migrations.RemoveConstraint(
            model_name='taskassignment',
            name='unique_task_assignment',
        ),
        migrations.RemoveConstraint(
            model_name='teammember',
            name='unique_team_member',
        ),

        # Remove relationships.
        migrations.RemoveField(
            model_name='organization',
            name='owner',
        ),
        migrations.RemoveField(
            model_name='organizationmember',
            name='organization',
        ),
        migrations.RemoveField(
            model_name='organizationmember',
            name='user',
        ),
        migrations.RemoveField(
            model_name='projectmember',
            name='project',
        ),
        migrations.RemoveField(
            model_name='projectmember',
            name='user',
        ),
        migrations.RemoveField(
            model_name='taskassignment',
            name='assigned_by',
        ),
        migrations.RemoveField(
            model_name='taskassignment',
            name='task',
        ),
        migrations.RemoveField(
            model_name='taskassignment',
            name='user',
        ),
        migrations.RemoveField(
            model_name='team',
            name='created_by',
        ),
        migrations.RemoveField(
            model_name='team',
            name='organization',
        ),
        migrations.RemoveField(
            model_name='teammember',
            name='team',
        ),
        migrations.RemoveField(
            model_name='teammember',
            name='user',
        ),

        migrations.AlterModelOptions(
            name='taskcomment',
            options={'ordering': ['created_at']},
        ),

        migrations.RemoveField(
            model_name='project',
            name='organization',
        ),
        migrations.RemoveField(
            model_name='project',
            name='team',
        ),

        migrations.AlterField(
            model_name='auditlog',
            name='action',
            field=models.CharField(
                choices=[
                    ('create', 'Create'),
                    ('update', 'Update'),
                    ('delete', 'Delete'),
                    ('login', 'Login'),
                    ('logout', 'Logout'),
                    ('register', 'Register'),
                    ('complete', 'Complete'),
                ],
                max_length=20,
            ),
        ),

        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(
                choices=[
                    ('task_created', 'Task Created'),
                    ('task_updated', 'Task Updated'),
                    ('task_completed', 'Task Completed'),
                    ('task_commented', 'Task Commented'),
                    ('deadline_reminder', 'Deadline Reminder'),
                    ('task_overdue', 'Task Overdue'),
                    ('status_changed', 'Status Changed'),
                ],
                max_length=30,
            ),
        ),

        migrations.AlterField(
            model_name='project',
            name='created_by',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='created_projects',
                to=settings.AUTH_USER_MODEL,
            ),
        ),

        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(
                fields=['user', 'created_at'],
                name='core_auditl_user_id_413764_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(
                fields=['recipient', 'is_read'],
                name='core_notifi_recipie_aeffaf_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='project',
            index=models.Index(
                fields=['created_by', 'status'],
                name='core_projec_created_052eea_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(
                fields=['project', 'status'],
                name='core_task_project_3c46c4_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(
                fields=['project', 'due_date'],
                name='core_task_project_5109f4_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(
                fields=['created_by', 'status'],
                name='core_task_created_c9f778_idx',
            ),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(
                fields=['status', 'due_date'],
                name='core_task_status_d09cc7_idx',
            ),
        ),

        migrations.AddConstraint(
            model_name='task',
            constraint=models.CheckConstraint(
                check=models.Q(
                    ('start_date__isnull', True),
                    ('due_date__isnull', True),
                    ('due_date__gte', models.F('start_date')),
                    _connector='OR',
                ),
                name='task_due_after_start',
            ),
        ),
        migrations.AddConstraint(
            model_name='task',
            constraint=models.CheckConstraint(
                check=models.Q(
                    ('parent_task', models.F('id')),
                    _negated=True,
                ),
                name='task_cannot_be_own_parent',
            ),
        ),

        # Delete obsolete models.
        migrations.DeleteModel(name='OrganizationMember'),
        migrations.DeleteModel(name='ProjectMember'),
        migrations.DeleteModel(name='TaskAssignment'),
        migrations.DeleteModel(name='TeamMember'),
        migrations.DeleteModel(name='Team'),
        migrations.DeleteModel(name='Organization'),
    ]
