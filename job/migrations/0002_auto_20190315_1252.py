# Generated by Django 2.0.1 on 2019-03-15 11:52

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('job', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='job',
            old_name='job_deadline',
            new_name='deadline',
        ),
        migrations.RenameField(
            model_name='job',
            old_name='job_description',
            new_name='description',
        ),
        migrations.RenameField(
            model_name='job',
            old_name='job_title',
            new_name='title',
        ),
    ]