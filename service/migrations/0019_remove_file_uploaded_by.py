# Generated by Django 5.0.4 on 2024-04-16 20:14

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('service', '0018_alter_project_description'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='file',
            name='uploaded_by',
        ),
    ]
